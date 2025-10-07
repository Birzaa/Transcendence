// backend/src/ws.ts
import { FastifyInstance } from "fastify";
import { WebSocketServer, WebSocket } from "ws";
import db from "../database";

interface Player {
  socket: WebSocket;
  username: string;
}

interface GameRoom {
  id: string;
  players: Player[];
  host: string;
  startTime?: number;
}

// --- Maps globales ---
const chatClients = new Map<WebSocket, string>(); // Utilisateurs dans le chat
const siteClients = new Map<WebSocket, string>(); // Tous les utilisateurs du site
const blockedMap = new Map<string, Set<string>>(); // username -> Set de blocages
const gameRooms = new Map<string, GameRoom>(); // id -> room
const hasWelcomed = new WeakSet<WebSocket>(); // sockets déjà accueillis
const gameClients = new Map<WebSocket, string>(); // jeu : socket -> username
const getUserIdStmt = db.prepare('SELECT id FROM users WHERE name = ?');

function getUserIdByName(username: string): number | null {
  const result = getUserIdStmt.get(username);
  // better-sqlite3 retourne l'objet si trouvé, undefined sinon
  if (result && typeof result === 'object' && 'id' in result) {
    return (result as { id: number }).id;
  }
  return null;
}

// --- Diffusion ---
function broadcastSiteUsers() {
  const userListMessage = JSON.stringify({
    type: "user_list",
    users: Array.from(siteClients.values()),
  });
  for (const client of siteClients.keys()) {
    if (client.readyState === WebSocket.OPEN) client.send(userListMessage);
  }
}

function broadcastChatUsers() {
  const chatUserListMessage = JSON.stringify({
    type: "online_users",
    users: Array.from(chatClients.values()),
  });
  for (const client of chatClients.keys()) {
    if (client.readyState === WebSocket.OPEN) client.send(chatUserListMessage);
  }
}

function getSocketByUsername(username: string): WebSocket | undefined {
  for (const [sock, name] of siteClients.entries()) {
    if (name === username) return sock;
  }
  return undefined;
}

function broadcastGame(roomId: string, data: any) {
  const room = gameRooms.get(roomId);
  if (!room) return;
  room.players.forEach((p) => {
    if (p.socket.readyState === WebSocket.OPEN) {
      p.socket.send(JSON.stringify(data));
    }
  });
}

// --- Gestion départ d'un joueur ---
function handlePlayerLeaving(roomId: string, leavingUsername: string) {
  const room = gameRooms.get(roomId);
  if (!room) return;

  room.players = room.players.filter(p => p.username !== leavingUsername);

  if (room.players.length === 0) {
    gameRooms.delete(roomId);
    console.log(`[ws] Salle ${roomId} supprimée`);
  } else {
    const remainingPlayer = room.players[0];
    if (remainingPlayer.socket.readyState === WebSocket.OPEN) {
      remainingPlayer.socket.send(JSON.stringify({
        type: "game_end",
        roomId: room.id,
        winner: remainingPlayer.username,
        message: "Votre adversaire a quitté la partie."
      }));
    }
    gameRooms.delete(roomId);
    console.log(`[ws] Salle ${roomId} supprimée après départ de ${leavingUsername}`);
  }
}

export default async function setupWebSocket(fastify: FastifyInstance) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (socket, request) => {
    const clientIp = request.socket.remoteAddress;
    console.log("[ws] Nouveau client connecté:", clientIp);

    if (!hasWelcomed.has(socket)) {
      socket.send(
        JSON.stringify({
          type: "message",
          from: "Server",
          content: "Bienvenue sur le chat !",
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

        // --- set_username ---
        if (data.type === "set_username") {
          username = data.username;
          isGameClient = !!data.isGame;
          inChat = !!data.inChat;

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

        // --- user_disconnected ---
        if (data.type === "user_disconnected" && username) {
          console.log(`[ws] ${username} s'est déconnecté`);
          siteClients.delete(socket);
          chatClients.delete(socket);
          broadcastSiteUsers();
          broadcastChatUsers();
          if (currentRoomId) handlePlayerLeaving(currentRoomId, username);
          return;
        }

        // --- leave_game ---
        if (data.type === "leave_game" && username && currentRoomId) {
          handlePlayerLeaving(currentRoomId, username);
          currentRoomId = null;
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
          socket.send(JSON.stringify({
            type: "private_message",
            from: username,
            to: recipientName,
            content: data.content,
          }));
          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            if (blockedMap.get(recipientName)?.has(username)) return;
            recipientSocket.send(JSON.stringify({
              type: "private_message",
              from: username,
              to: recipientName,
              content: data.content,
            }));
          }
          return;
        }

        // --- Invitation de jeu via chat---
        if (data.type === "invite_to_game" && username) {
          const targetName = data.target;
          const targetSocket = getSocketByUsername(targetName);

          if (!targetSocket || targetSocket.readyState !== WebSocket.OPEN) {
            socket.send(
              JSON.stringify({ type: "error", content: `${targetName} est hors ligne ou introuvable.` })
            );
            return;
          }

          if (blockedMap.get(targetName)?.has(username)) {
            socket.send(
              JSON.stringify({ type: "error", content: `Votre invitation à ${targetName} a été bloquée.` })
            );
            return;
          }
          
          // Envoi de l'invitation à la cible
          targetSocket.send(
            JSON.stringify({
              type: "game_invite",
              from: username,
            })
          );
          console.log(`[ws] ${username} a invité ${targetName} à jouer.`);
          return;
        }

        // --- ACCEPTATION/REFUS D'INVITATION ---
        if (data.type === "accept_invite" && username) {
          const inviterName = data.inviter;
          const inviterSocket = getSocketByUsername(inviterName);
          const accepted = data.accept;

          if (!inviterSocket || inviterSocket.readyState !== WebSocket.OPEN) {
            socket.send(
              JSON.stringify({ type: "error", content: `L'inviteur (${inviterName}) est parti.` })
            );
            return;
          }

          if (accepted) {
            const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
            
            // 1. Définir les objets Player et CRÉER LA SALLE SUR LE SERVEUR
            // ÉTAPE CRUCIALE : Enregistrer la salle pour que le routage des messages de jeu fonctionne.
            const hostPlayer = { socket: inviterSocket, username: inviterName };
            const guestPlayer = { socket: socket, username: username }; // 'socket' est la socket de l'invité

            gameRooms.set(roomId, {
                id: roomId,
                players: [hostPlayer, guestPlayer],
                host: inviterName,
            });
            
            console.log(`[ws] Salle ${roomId} créée pour ${inviterName} (Host) et ${username} (Guest).`);

            // 2. Informer l'INVITEUR (le HOST)
            // Il va recevoir 'room_created_for_game', se mettre en mode isGame: true et naviguer.
            inviterSocket.send(
              JSON.stringify({ 
                type: "room_created_for_game", 
                roomId,
                opponent: username,
                role: "host",      // Rôle: HOST (joueur P1)
                host: inviterName   // Nom de l'hôte
              })
            );

            // 3. Informer l'INVITÉ (le GUEST)
            // Il va recevoir 'room_created_for_game', se mettre en mode isGame: true et naviguer.
            socket.send(
              JSON.stringify({ 
                type: "room_created_for_game", 
                roomId,
                opponent: inviterName, // L'opposant est l'inviteur, le host
                role: "guest",       // Rôle: GUEST (joueur P2)
                host: inviterName   // Nom de l'hôte
              })
            );
            
          } else {
            // Refus. Notifier l'inviteur.
            inviterSocket.send(
              JSON.stringify({ 
                type: "message", 
                from: "System", 
                content: `${username} a refusé votre invitation à jouer.`
              })
            );
            console.log(`[ws] ${username} a refusé l'invitation de ${inviterName}.`);
          }
          return;
        }

        // --- Enregistrement des scores de jeu ---
         // -- Enregistrement des scores de jeu ---
        if (data.type === "game_end" && username) {
          const room = gameRooms.get(data.roomId);

          // Seul le HOST peut envoyer game_end
          if (!room || room.host !== username) {
            console.warn(`[ws] Tentative d'enregistrement de fin de partie non autorisée par ${username}`);
            return;
          }

          const { score1, score2, duration } = data;
          
          const guestUsername = room.players.find(p => p.username !== room.host)?.username;

          // Récupérer les IDs des joueurs
          const hostPlayer = room.players.find(p => p.username === room.host);
          const guestPlayer = room.players.find(p => p.username !== room.host);

          if (guestUsername) {
            
            // 1. RÉCUPÉRATION DES IDs (via la DB)
            const hostUser = getUserIdByName(username);
            const guestUser = getUserIdByName(guestUsername);

            if (!hostUser || !guestUser) {
                 console.error(`[ws] Erreur: impossible de trouver les IDs DB pour ${username} ou ${guestUsername}`);
                 return;
            }

            const winnerId = score1 > score2 ? hostUser : guestUser;

            try {
              const query = db.prepare(`
                INSERT INTO games (player1_id, player2_id, player1_score, player2_score, winner_id, duration) 
                VALUES (?, ?, ?, ?, ?, ?)
                `);
              
              // 2. CORRECTION : Passage des arguments positionnels (les IDs et scores)
              query.run(hostUser, guestUser, score1, score2, winnerId, duration);
              
              console.log(`[ws] Partie enregistrée: ${username} vs ${guestUsername}, score ${score1}-${score2}, durée ${duration}s`);
              
              // Optionnel : Supprimer la salle après enregistrement
              gameRooms.delete(data.roomId);
              console.log(`[ws] Salle ${data.roomId} supprimée après enregistrement de la partie.`);

            } catch (err) {
              console.error("[ws] Erreur enregistrement partie:", err);
            }
          }
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

        // --- leave_chat ---
        if (data.type === "leave_chat" && username) {
          chatClients.delete(socket);
          inChat = false;
          broadcastChatUsers();
          console.log(`[ws] ${username} a quitté la page chat`);
          return;
        }

        // --- GAME (Méthode de jointure manuelle, non utilisée pour l'invite) ---
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

          socket.send(JSON.stringify({
            type: "room_joined",
            roomId: data.roomId,
            players: room.players.map(p => p.username),
            host: room.host
          }));

          const hostPlayer = room.players.find(p => p.username === room.host);
          if (hostPlayer && hostPlayer.socket.readyState === WebSocket.OPEN) {
            hostPlayer.socket.send(JSON.stringify({
              type: "opponent_joined",
              opponent: username
            }));
          }

          if (room.players.length === 2) {
            room.startTime = Date.now(); // Enregistrer le début de la partie
            broadcastGame(room.id, {
              type: "game_start",
              host: room.host,
              players: room.players.map(p => p.username),
            });
          }
          return;
        }

        // --- Gestion des messages de jeu synchronisés ---
        // Le HOST envoie l'état du jeu (balle + P1) au GUEST
        if (data.type === "game_state") {
          const room = gameRooms.get(data.roomId || currentRoomId);
          // Seul le HOST est censé envoyer game_state
          if (room && room.host === username) { 
            // Diffuser à l'autre joueur (le GUEST)
            for (const player of room.players) {
                if (player.socket !== socket && player.socket.readyState === WebSocket.OPEN) {
                    player.socket.send(JSON.stringify(data));
                    break;
                }
            }
          }
          return;
        }

        // Le GUEST envoie la position de sa raquette (P2) au HOST
        if (data.type === "paddle_move") {
          const room = gameRooms.get(data.roomId || currentRoomId);
          // Seul le GUEST est censé envoyer paddle_move (car il contrôle P2)
          if (room && room.host !== username) { 
            // Relayer le mouvement uniquement au HOST
            for (const player of room.players) {
                if (player.username === room.host && player.socket.readyState === WebSocket.OPEN) {
                    player.socket.send(JSON.stringify({ type: "paddle_move", roomId: room.id, player: "guest", y: data.y }));
                    break;
                }
            }
          }
          return;
        }

        if (data.type === "game_end") {
          const room = gameRooms.get(data.roomId || currentRoomId);
          if (room && room.host === username) {
            broadcastGame(room.id, {
              type: "game_end",
              roomId: room.id,
              winner: data.winner
            });

            // Enregistrer la partie dans la base de données
            if (data.player1Score != null && data.player2Score != null && data.duration != null) {
              try {
                const player1 = room.players[0]?.username;
                const player2 = room.players[1]?.username;

                if (player1 && player2) {
                  const p1 = db.prepare('SELECT id FROM users WHERE name = ?').get(player1) as { id?: number } | undefined;
                  const p2 = db.prepare('SELECT id FROM users WHERE name = ?').get(player2) as { id?: number } | undefined;

                  const player1_id = p1?.id ?? null;
                  const player2_id = p2?.id ?? null;

                  let winnerId: number | null = null;
                  if (data.player1Score > data.player2Score) winnerId = player1_id ?? null;
                  else if (data.player2Score > data.player1Score) winnerId = player2_id ?? null;

                  const stmt = db.prepare(`
                    INSERT INTO games
                      (player1_id, player2_id, player1_name, player2_name, player1_score, player2_score, winner_id, duration)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  `);

                  stmt.run(
                    player1_id,
                    player2_id,
                    player1,
                    player2,
                    data.player1Score,
                    data.player2Score,
                    winnerId,
                    data.duration
                  );

                  console.log(`[ws] Partie enregistrée: ${player1} vs ${player2} (${data.player1Score}-${data.player2Score})`);
                }
              } catch (err) {
                console.error('[ws] Erreur enregistrement partie:', err);
              }
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
      chatClients.delete(socket);
      siteClients.delete(socket);
      gameClients.delete(socket);
      broadcastSiteUsers();
      broadcastChatUsers();

      if (currentRoomId) handlePlayerLeaving(currentRoomId, username);
    });

    socket.on("error", (err) => {
      console.error("[ws] Erreur WebSocket:", err);
      chatClients.delete(socket);
      siteClients.delete(socket);
      gameClients.delete(socket);
      broadcastSiteUsers();
      broadcastChatUsers();

      if (currentRoomId) handlePlayerLeaving(currentRoomId, username);
    });
  });

  fastify.server.on("upgrade", (request, socket, head) => {
    if (request.url === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });
}

