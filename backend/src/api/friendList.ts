import { FastifyInstance } from 'fastify';
import db from '../database';

export default async function friendList(fastify: FastifyInstance) {
  fastify.get('/api/friends', async (request, reply) => {
    const userId = Number((request.query as any).userId);
    if (!userId) {
      return reply.status(400).send({ error: 'Missing userId' });
    }

    try {
      const friends = db.prepare(`
        SELECT u.id, u.name FROM friends f
        JOIN users u ON u.id = f.friend_id
        WHERE f.user_id = ?
      `).all(userId); // 👈 utilise `.all()` directement ici

      return friends;
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Database error' });
    }
  });
}
