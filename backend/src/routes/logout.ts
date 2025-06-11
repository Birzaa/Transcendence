import { FastifyInstance } from 'fastify';

export default async function (app: FastifyInstance) {
  app.post('/logout', async (request, reply) => {
    await request.session.destroy();
    return reply.redirect('http://localhost:3000/login');
  });
}
