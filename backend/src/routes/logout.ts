import { FastifyInstance } from 'fastify';

export default async function (app: FastifyInstance) {
  app.post('/logout', async (request, reply) => {
    await request.session.destroy();
    reply.clearCookie('sessionId');
    return reply.send({ success: true });;
  });
}
