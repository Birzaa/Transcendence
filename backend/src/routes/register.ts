import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt'
import db from '../database';

export default async function (app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const { name, email, password } = request.body as { name: string; email: string, password: string };

    if (!name || !email || !password) {
    return reply.redirect('http://localhost:3000/register?error=missing-fields');
  	}

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
      stmt.run(name, email, hashedPassword);

	  return reply.redirect('http://localhost:3000/index');
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return reply.redirect('http://localhost:3000/register?error=email-used');
      }
      app.log.error(err);
      return reply.status(500).send({ error: 'Erreur serveur' });
    }
  });
}
