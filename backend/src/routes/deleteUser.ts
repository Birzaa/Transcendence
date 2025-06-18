import { FastifyInstance } from 'fastify';
import db from '../database';

export default async function deleteUserRoute(app: FastifyInstance) {
app.delete('/deleteUser', async (request, reply) => {
  const currentUser = (request.session as any)?.user;
  app.log.info('Current user from session:', currentUser);

  if (!currentUser) {
    return reply.status(401).send({ error: 'unauthorized' });
  }

  try {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(currentUser.id);
    app.log.info('DB delete result:', result);

    await new Promise<void>((resolve, reject) => {
      request.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    reply.clearCookie('sessionId', {
      path: '/',
      secure: false,
      sameSite: 'lax',
    });

    return reply.send({ success: true });
  } catch (err) {
    app.log.error('Error deleting user:', err instanceof Error ? err.stack : err);
    return reply.status(500).send({ error: 'server-error' });
  }
});

}
