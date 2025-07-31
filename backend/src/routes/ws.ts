import { FastifyInstance } from 'fastify';
import { WebSocketServer } from 'ws';

export default async function websocketRoutes(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (connection, req) => {
    if (!connection || !connection.socket) {
      app.log.error('WebSocket connection is not properly established');
      return;
    }

    console.log('💬 Nouveau client WebSocket');

    connection.socket.on('message', (message) => {
      console.log('📨 Message reçu :', message.toString());
      connection.socket.send('pong');
    });

    connection.socket.on('close', () => {
      console.log('❌ Client déconnecté');
    });

    connection.socket.on('error', (error) => {
      console.error('🔥 Erreur WebSocket :', error);
    });
  });
}