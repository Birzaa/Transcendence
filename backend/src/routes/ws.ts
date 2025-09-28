// backend/src/ws.ts
import { FastifyInstance } from "fastify";
import { WebSocketServer, WebSocket } from "ws";

interface Player {
  socket: WebSocket;
  username: string;
}

interface GameRoom {
  id: string;
  players: Player[];
  host: string;
}

// --- Maps globales ---
const chatClients = new Map<WebSocket, string>(); // Utilisateurs dans le chat
const siteClients = new Map<WebSocket, string>(); // Tous les utilisateurs du site
const blockedMap = new Map<string, Set<string>>(); // username -> Set de blocages
const gameRooms = new Map<string, GameRoom>(); // id -> room
const hasWelcomed = new WeakSet<WebSocket>(); // sockets déjà accueillis
const gameClients = new Map<WebSocket, string>(); // jeu : socket -> username

// --- Diffusion de la liste des utilisateurs connectés au site ---
function broadcastSiteUsers() {
  const userListMessage = JSON.stringify({
    type: "user_list",
    users: Array.from(siteClients.values()),
  });

  for (const client of siteClients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(userListMessage);
    }
  }
}

// --- Diffusion de la liste des utilisateurs dans le chat ---
function broadcastChatUsers() {
  const chatUserListMessage = JSON.stringify({
    type: "online_users",
    users: Array.from(chatClients.values()),
  });

  for (const client of chatClients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(chatUserListMessage);
    }
  }
}

// --- Récupérer un socket par username ---
function getSocketByUsername(username: string): WebSocket | undefined {
  for (const [sock, name] of siteClients.entries()) {
    if (name === username) return sock;
  }
  return undefined;
}

// --- Diffusion d'un message de jeu dans une room ---
function broadcastGame(roomId: string, data: any) {
  const room = gameRooms.get(roomId);
  if (!room) return;
  room.players.forEach((p) => {
    if (p.socket.readyState === WebSocket.OPEN) {
      p.socket.send(JSON.stringify(data));
    }
  });
}

export default async function setupWebSocket(fastify: FastifyInstance) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (socket, request) => {
    const clientIp = request.socket.remoteAddress;
    console.log("[ws] Nouveau client connecté:", clientIp);

    // Message de bienvenue unique
    if (!hasWelcomed.has(socket)) {
      socket.send(
        JSON.stringify({
          type: "message",
          from: "Server",
          content: "Bienvenue sur le serveur WebSocket !",
        })
      );
      hasWelcomed.add(socket);
    }

    let username = "anonymous";
    let currentRoomId: string | null = null;
    let isGameClient = false;
    let inChat = false;

    socket.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        // --- Définir le pseudo ---
        if (data.type === "set_username") {
          username = data.username;
          isGameClient = !!data.isGame;
          inChat = !!data.inChat;

          // MODIFICATION : Gestion des deux listes
          siteClients.set(socket, username);
          broadcastSiteUsers();

          if (inChat && !isGameClient) {
            chatClients.set(socket, username);
            broadcastChatUsers();
          } else {
            chatClients.delete(socket);
            broadcastChatUsers();
          }

          if (!isGameClient) {
            const existingSocket = getSocketByUsername(username);
            if (existingSocket && existingSocket !== socket) {
              console.log(`[ws] ${username} déjà connecté, fermeture ancienne connexion`);
              existingSocket.close();
              siteClients.delete(existingSocket);
              chatClients.delete(existingSocket);
              broadcastSiteUsers();
              broadcastChatUsers();
            }
          } else {
            gameClients.set(socket, username);
          }

          if (!blockedMap.has(username)) blockedMap.set(username, new Set());
          console.log(`[ws] Pseudo défini: ${username} (isGame: ${isGameClient}, inChat: ${inChat})`);
          return;
        }

        // --- Déconnexion utilisateur ---
        if (data.type === "user_disconnected" && username) {
          console.log(`[ws] ${username} s'est déconnecté`);
          siteClients.delete(socket);
          chatClients.delete(socket);
          broadcastSiteUsers();
          broadcastChatUsers();
          return;
      }

        // --- CHAT ---
        if (data.type === "message" && username && inChat) {
          const payload = JSON.stringify({
            type: "message",
            from: username,
            content: data.content,
          });

          for (const [client, recipientUsername] of chatClients.entries()) {
            if (
              client.readyState === WebSocket.OPEN &&
              recipientUsername &&
              !blockedMap.get(username)?.has(recipientUsername) &&
              !blockedMap.get(recipientUsername)?.has(username)
            ) {
              client.send(payload);
            }
          }
          return;
        }

        if (data.type === "private_message" && username && inChat) {
          const recipientName = data.to;
          const recipientSocket = getSocketByUsername(recipientName);

          // Confirmation à l'expéditeur
          socket.send(
            JSON.stringify({
              type: "private_message",
              from: username,
              to: recipientName,
              content: data.content,
            })
          );

          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            if (blockedMap.get(recipientName)?.has(username)) return;
            recipientSocket.send(
              JSON.stringify({
                type: "private_message",
                from: username,
                to: recipientName,
                content: data.content,
              })
            );
          }
          return;
        }

        // --- Blocage ---
        if (data.type === "block" && username) {
          blockedMap.get(username)?.add(data.target);
          console.log(`[ws] ${username} a bloqué ${data.target}`);
          return;
        }

        if (data.type === "unblock" && username) {
          blockedMap.get(username)?.delete(data.target);
          console.log(`[ws] ${username} a débloqué ${data.target}`);
          return;
        }

        // --- Déconnexion de la page chat (SPA) ---
        if (data.type === "leave_chat" && username) {
          chatClients.delete(socket);
          inChat = false;
          broadcastChatUsers();
          console.log(`[ws] ${username} a quitté la page chat`);
          return;
        }

        // --- GAME ---
        if (data.type === "create_room") {
          if (!username) return socket.send(JSON.stringify({ type: "error", content: "Pseudo requis" }));
          const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
          gameRooms.set(roomId, { id: roomId, players: [{ socket, username }], host: username });
          currentRoomId = roomId;
          socket.send(JSON.stringify({ type: "room_created", roomId }));
          return;
        }

        if (data.type === "join_room") {
          const room = gameRooms.get(data.roomId);
          if (!room) return socket.send(JSON.stringify({ type: "error", content: "Salle introuvable." }));
          if (room.players.length >= 2) return socket.send(JSON.stringify({ type: "error", content: "Salle pleine." }));

          room.players.push({ socket, username });
          currentRoomId = data.roomId;

          // Notifier invité
          socket.send(JSON.stringify({
            type: "room_joined",
            roomId: data.roomId,
            players: room.players.map(p => p.username),
            host: room.host
          }));

          // Notifier hôte
          const hostPlayer = room.players.find(p => p.username === room.host);
          if (hostPlayer && hostPlayer.socket.readyState === WebSocket.OPEN) {
            hostPlayer.socket.send(JSON.stringify({
              type: "opponent_joined",
              opponent: username
            }));
          }

          if (room.players.length === 2) {
            broadcastGame(room.id, {
              type: "game_start",
              host: room.host,
              players: room.players.map(p => p.username),
            });
          }
          return;
        }

        if (data.type === "game_state") {
          const room = gameRooms.get(data.roomId || currentRoomId);
          if (room && room.host === username) {
            const guest = room.players.find(p => p.username !== username);
            if (guest && guest.socket.readyState === WebSocket.OPEN) {
              guest.socket.send(JSON.stringify({ type: "game_state", roomId: room.id, state: data.state }));
            }
          }
          return;
        }

        if (data.type === "paddle_move") {
          const room = gameRooms.get(data.roomId || currentRoomId);
          if (room && room.host !== username) {
            const host = room.players.find(p => p.username === room.host);
            if (host && host.socket.readyState === WebSocket.OPEN) {
              host.socket.send(JSON.stringify({ type: "paddle_move", roomId: room.id, player: "guest", y: data.y }));
            }
          }
          return;
        }

      } catch (err) {
        console.error("[ws] Erreur parsing:", err);
      }
    });

    socket.on("close", () => {
      console.log(`[ws] Utilisateur ${username} déconnecté (${clientIp})`);
      
      // MODIFICATION IMPORTANTE : Toujours diffuser les mises à jour après suppression
      chatClients.delete(socket);
      siteClients.delete(socket);
      gameClients.delete(socket);

      // Diffuser les mises à jour immédiatement
      broadcastSiteUsers();
      broadcastChatUsers();

      if (currentRoomId) {
        const room = gameRooms.get(currentRoomId);
        if (room) {
          room.players = room.players.filter(p => p.socket !== socket);
          if (room.players.length === 0) {
            gameRooms.delete(currentRoomId);
            console.log(`[ws] Salle ${currentRoomId} supprimée`);
          } else {
            const remainingPlayer = room.players[0];
            if (remainingPlayer.socket.readyState === WebSocket.OPEN) {
              remainingPlayer.socket.send(JSON.stringify({
                type: "opponent_disconnected",
                message: "Votre adversaire a quitté la partie."
              }));
            }
          }
        }
      }
    });

    socket.on("error", (err) => {
      console.error("[ws] Erreur WebSocket:", err);
      
      // En cas d'erreur, nettoyer aussi
      chatClients.delete(socket);
      siteClients.delete(socket);
      gameClients.delete(socket);
      broadcastSiteUsers();
      broadcastChatUsers();
    });
  });

  // --- Upgrade HTTP vers WebSocket ---
  fastify.server.on("upgrade", (request, socket, head) => {
    if (request.url === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });
}