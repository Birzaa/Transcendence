import { FastifyInstance } from 'fastify';

export default async function meRoute(app: FastifyInstance) {
  app.get('/api/me', async (req, reply) => {
    if (!req.session.user) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    return {
      id: req.session.user.id,
      name: req.session.user.name,
      email: req.session.user.email,
      avatar: req.session.user.avatar,
    };
  });
}