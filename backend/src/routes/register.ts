import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import db from '../database';

export default async function (app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const { name, email, password } = request.body as {
      name: string;
      email: string;
      password: string;
    };

    if (!name || !email || !password) {
      return reply.status(400).send({ error: 'missing-fields' });
    }

    if (name.length > 10) {
      return reply.status(400).send({ error: 'name too long (max 10 characters)' });
    }
    

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const stmt = db.prepare(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
      );
      stmt.run(name, email, hashedPassword);

      return reply.send({ success: true });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        if (err.message.includes('users.email'))
          return reply.status(409).send({ error: 'email already used' });
        if (err.message.includes('users.name'))
          return reply.status(409).send({ error: 'name already used' });
      }
      app.log.error(err);
      return reply.status(500).send({ error: 'server-error' });
    }
  });
}
