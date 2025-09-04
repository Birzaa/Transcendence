import { FastifyInstance } from 'fastify';
import { WebSocket, WebSocketServer } from 'ws';

interface Player {
  socket: WebSocket;
  username: string;
}

interface GameRoom {
  id: string;
  players: Player[];
  host?: string;
}

export default async function setupWebSocket(fastify: FastifyInstance) {
  const wss = new WebSocketServer({ noServer: true });

  // ------------------- CHAT -------------------
  const chatClients = new Map<WebSocket, string>(); // socket -> username
  const blockedMap = new Map<string, Set<string>>(); // username -> Set of blocked usernames

  function broadcastUserList() {
    const userListMessage = JSON.stringify({
      type: 'user_list',
      users: Array.from(chatClients.values()),
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(userListMessage);
      }
    });
  }

  function getSocketByUsername(username: string): WebSocket | undefined {
    for (const [sock, name] of chatClients.entries()) {
      if (name === username) return sock;
    }
    return undefined;
  }

  // ------------------- JEU -------------------
  const gameRooms = new Map<string, GameRoom>();

  function broadcastGame(roomId: string, data: any) {
    const room = gameRooms.get(roomId);
    if (!room) return;
    room.players.forEach(p => {
      if (p.socket.readyState === WebSocket.OPEN) {
        p.socket.send(JSON.stringify(data));
      }
    });
  }

  // ------------------- CONNECTION -------------------
  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'message', from: 'Server', content: 'Bienvenue !' }));

    let username = '';
    let currentRoomId: string | null = null;

    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        // ------------------- CHAT -------------------
        if (data.type === 'set_username' && !data.isGame) {
          username = data.username;
          chatClients.set(socket, username);
          if (!blockedMap.has(username)) blockedMap.set(username, new Set());
          socket.send(JSON.stringify({ type: 'info', content: `Pseudo défini à ${username}` }));
          broadcastUserList();
          return;
        }

        if (data.type === 'block' && username) {
          blockedMap.get(username)?.add(data.target);
          return;
        }

        if (data.type === 'unblock' && username) {
          blockedMap.get(username)?.delete(data.target);
          return;
        }

        if (data.type === 'message' && username) {
          const payload = JSON.stringify({ type: 'message', from: username, content: data.content });
          wss.clients.forEach(client => {
            const recipient = chatClients.get(client);
            if (
              client.readyState === WebSocket.OPEN &&
              recipient &&
              !blockedMap.get(username)?.has(recipient) &&
              !blockedMap.get(recipient)?.has(username)
            ) {
              client.send(payload);
            }
          });
          return;
        }

        if (data.type === 'private_message' && username) {
          const recipientSocket = getSocketByUsername(data.to);
          const recipientName = data.to;
          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            if (!blockedMap.get(recipientName)?.has(username)) {
              recipientSocket.send(JSON.stringify({
                type: 'private_message',
                from: username,
                content: data.content
              }));
            }
          }
          return;
        }

        // ------------------- JEU -------------------
        if (data.type === 'set_username' && data.isGame) {
          username = data.username;
          socket.send(JSON.stringify({ type: 'info', content: `Pseudo défini à ${username}` }));
          return;
        }

        if (data.type === 'create_room' && username) {
          const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
          gameRooms.set(roomId, { id: roomId, players: [{ socket, username }], host: username });
          currentRoomId = roomId;
          socket.send(JSON.stringify({ type: 'room_created', roomId }));
          return;
        }

        if (data.type === 'join_room' && username) {
          const room = gameRooms.get(data.roomId);
          if (!room) {
            socket.send(JSON.stringify({ type: 'error', content: 'Salle introuvable' }));
            return;
          }

          // Empêcher un joueur de rejoindre deux fois
          if (room.players.some(p => p.username === username)) {
            // Déjà dans la salle : simplement renvoyer l'état de salle
            socket.send(JSON.stringify({
              type: 'room_joined',
              roomId: room.id,
              host: room.host
            }));
            // Si la salle est complète on (re)notifie le start
            if (room.players.length === 2) {
              broadcastGame(room.id, {
                type: 'game_start',
                host: room.host,
                players: room.players.map(p => p.username)
              });
            }
            currentRoomId = room.id;
            return;
          }

          if (room.players.length >= 2) {
            socket.send(JSON.stringify({ type: 'error', content: 'La salle est pleine' }));
            return;
          }

          room.players.push({ socket, username });
          currentRoomId = room.id;

          // Réponse immédiate au joueur qui rejoint
          socket.send(JSON.stringify({
            type: 'room_joined',
            roomId: room.id,
            host: room.host
          }));

          // Si la salle est maintenant complète → démarrer
          if (room.players.length === 2) {
            broadcastGame(room.id, {
              type: 'game_start',
              host: room.host,
              players: room.players.map(p => p.username)
            });
          } else {
            // Notifier seulement l'hôte qu'un joueur a rejoint
            const hostPlayer = room.players.find(p => p.username === room.host);
            if (hostPlayer) {
              hostPlayer.socket.send(JSON.stringify({
                type: 'player_joined',
                username
              }));
            }
          }
          return;
        }

        // Host envoie l'état de jeu (obligatoirement avec roomId)
        if (data.type === 'game_state') {
          const roomId = data.roomId || currentRoomId;
          if (!roomId || roomId !== currentRoomId) return;
          broadcastGame(roomId, { type: 'game_state', roomId, state: data.state });
          return;
        }

        // Guest (ou host) peut envoyer un déplacement de paddle
        if (data.type === 'paddle_move') {
          const roomId = data.roomId || currentRoomId;
          if (!roomId || roomId !== currentRoomId) return;

          // On rebroadcast à tous (host et guest)
          broadcastGame(roomId, {
            type: 'paddle_move',
            roomId,
            player: data.player,
            y: data.y
          });
          return;
        }

      } catch (err) {
        console.error('Invalid message format', err);
      }
    });

    socket.on('close', () => {
      if (username) {
        chatClients.delete(socket);
        broadcastUserList();
      }
      // Supprimer des rooms si nécessaire
      if (currentRoomId) {
        const room = gameRooms.get(currentRoomId);
        if (room) {
          room.players = room.players.filter(p => p.socket !== socket);
          if (room.players.length === 0) gameRooms.delete(currentRoomId);
        }
      }
      console.log(`Utilisateur ${username || 'inconnu'} déconnecté`);
    });
  });

  // ------------------- UPGRADE -------------------
  fastify.server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
}
