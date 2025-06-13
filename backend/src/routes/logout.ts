import { FastifyInstance } from 'fastify';

export default async function (app: FastifyInstance) {
  app.post('/logout', async (request, reply) => {
    await request.session.destroy();
    return reply.send({ success: true });;
  });
}
