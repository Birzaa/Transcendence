import { FastifyInstance, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import db from '../database';

type User = {
  id: number;
  name: string;
  email: string;
  password: string;
};

export default async function (app: FastifyInstance) {
app.post('/login', async (request, reply) => {
  const { email, password } = request.body as { email: string; password: string };

  if (!email || !password) {
    return reply.status(400).send({ error: 'missing-fields' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User;
  if (!user) {
    return reply.status(401).send({ error: 'user-not-found' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return reply.status(401).send({ error: 'wrong-password' });
  }

  request.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  return reply.send({ success: true });
});
}