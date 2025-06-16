import { FastifyInstance } from 'fastify';
import db from '../database';

export default async function removeFriend(fastify: FastifyInstance) {
  fastify.delete('/api/removeFriend', async (request, reply) => {
    // Récupérer l'utilisateur connecté depuis la session
    const currentUser = (request.session as any)?.user;
    if (!currentUser) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Récupérer friendName du body
    const { friendName } = request.body as { friendName?: string };
    if (!friendName || typeof friendName !== 'string') {
      return reply.status(400).send({ error: 'Invalid friendName' });
    }

    // Récupérer l'id de l'ami
    const friend = db.prepare('SELECT id FROM users WHERE name = ?').get(friendName);
    if (!friend) {
      return reply.status(404).send({ error: 'Friend user not found' });
    }

    if (friend.id === currentUser.id) {
      return reply.status(400).send({ error: 'Cannot remove yourself as friend' });
    }

    // Vérifier si c’est bien un ami
    const existingFriend = db.prepare('SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?')
      .get(currentUser.id, friend.id);
    if (!existingFriend) {
      return reply.status(400).send({ error: 'Not friends' });
    }

    // Supprimer la relation d’amitié
    try {
      db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(currentUser.id, friend.id);
      return reply.send({ success: true });
    } catch (err) {
      console.error('Error removing friend:', err);
      return reply.status(500).send({ error: 'Database error' });
    }
  });
}
