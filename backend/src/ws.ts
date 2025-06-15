import { FastifyInstance } from 'fastify';
import { WebSocketServer } from 'ws';

export default async function setupWebSocket(fastify: FastifyInstance) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (socket) => {
    // Envoi un message de bienvenue
    socket.send(JSON.stringify({ type: 'message', from: 'Server', content: 'Bienvenue dans le chat !' }));

    // Stockage du pseudo sur le socket
    let username: string | null = null;

    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'set_username') {
          // Le client envoie son pseudo au début
          username = data.username;
          socket.send(JSON.stringify({ type: 'info', content: `Pseudo défini à ${username}` }));
          return;
        }

        if (data.type === 'message' && username) {
          // Re-broadcast le message à tous les clients connectés
          const broadcastData = JSON.stringify({
            type: 'message',
            from: username,
            content: data.content,
          });

          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        }
      } catch (err) {
        console.error('Invalid message format', err);
      }
    });

    socket.on('close', () => {
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
