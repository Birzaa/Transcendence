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

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'message', from: 'Server', content: 'Bienvenue dans le chat !' }));

    let username: string;

    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'set_username') {
          username = data.username;
          clients.set(socket, username);
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
              !blockedMap.get(username)?.has(recipient) && // sender n’a pas bloqué le receiver
              !blockedMap.get(recipient)?.has(username)    // receiver n’a pas bloqué le sender
            ) {
              client.send(payload);
            }
          });
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

  fastify.server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
}
