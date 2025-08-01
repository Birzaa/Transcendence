import { FastifyInstance } from 'fastify';
import { WebSocket, WebSocketServer } from 'ws';

export default async function setupWebSocket(fastify: FastifyInstance) {
  const wss = new WebSocketServer({ noServer: true });

  const clients = new Map<WebSocket, string>(); // socket -> username
  const blockedMap = new Map<string, Set<string>>(); // username -> Set of blocked usernames

  function broadcastUserList() {
    const userListMessage = JSON.stringify({
      type: 'user_list',
      users: Array.from(clients.values()),
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(userListMessage);
      }
    });
  }

  function getSocketByUsername(username: string): WebSocket | undefined {
    for (const [sock, name] of clients.entries()) {
      if (name === username) return sock;
    }
    return undefined;
  }

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'message', from: 'Server', content: 'Bienvenue dans le chat !' }));

    let username: string;

    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        // 1. Définition du username
        if (data.type === 'set_username') {
          username = data.username;
          clients.set(socket, username);
          if (!blockedMap.has(username)) blockedMap.set(username, new Set());
          socket.send(JSON.stringify({ type: 'info', content: `Pseudo défini à ${username}` }));
          broadcastUserList();
          return;
        }

        // 2. Blocage / Déblocage
        if (data.type === 'block' && username) {
          blockedMap.get(username)?.add(data.target);
          return;
        }

        if (data.type === 'unblock' && username) {
          blockedMap.get(username)?.delete(data.target);
          return;
        }

        // 3. Message global
        if (data.type === 'message' && username) {
          const payload = JSON.stringify({
            type: 'message',
            from: username,
            content: data.content,
          });

          wss.clients.forEach(client => {
            const recipient = clients.get(client);
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

        // 4. Message privé
        if (data.type === 'private_message' && username) {
          const recipientSocket = getSocketByUsername(data.to);
          const recipientName = data.to;

          if (
            recipientSocket &&
            recipientSocket.readyState === WebSocket.OPEN &&
            !blockedMap.get(recipientName)?.has(username)
          ) {
            recipientSocket.send(JSON.stringify({
              type: 'private_message',
              from: username,
              content: data.content
            }));
          }
          return;
        }

      } catch (err) {
        console.error('Invalid message format', err);
      }
    });

    socket.on('close', () => {
      if (username) {
        clients.delete(socket);
        broadcastUserList();
      }
      console.log(`Utilisateur ${username || 'inconnu'} déconnecté`);
    });
  });

  // WebSocket upgrade
  fastify.server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
}