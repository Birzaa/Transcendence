import { FastifyInstance } from 'fastify';
import db from '../database';

export default async function deleteUserRoute(app: FastifyInstance) {
  app.delete('/deleteUser', async (request, reply) => {
    const currentUser = (request.session as any)?.user;
    if (!currentUser) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    try {
      // Supprime l'utilisateur en base selon son id
      db.prepare('DELETE FROM users WHERE id = ?').run(currentUser.id);

      // Détruit la session pour forcer la déconnexion
      await new Promise<void>((resolve, reject) => {
        request.session.destroy((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return reply.send({ success: true });
    } catch (err) {
      app.log.error('Error deleting user:', err);
      return reply.status(500).send({ error: 'server-error' });
    }
  });
}
