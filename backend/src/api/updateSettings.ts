import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import db from '../database';

export default async function updateSettings(app: FastifyInstance) {
  app.post('/api/updateSettings', async (request, reply) => {
    const currentUser = (request.session as any)?.user;
    if (!currentUser) {
      return reply.status(401).send({ error: 'unauthorized' });
    }
    const { name, email, password } = request.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name && !email && !password) {
      return reply.status(400).send({ error: 'no-fields-to-update' });
    }

    try {
      // Vérification du nom s'il est modifié
      if (name) {
        const existing = db
          .prepare('SELECT id FROM users WHERE name = ? AND id != ?')
          .get(name, currentUser.id);
        if (existing) {
          return reply.status(409).send({ error: 'name-already-used' });
        }

        db.prepare('UPDATE users SET name = ? WHERE id = ?')
          .run(name, currentUser.id);
        request.session.user.name = name;
      }

      // Vérification de l'email s'il est modifié
      if (email) {
        const existing = db
          .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
          .get(email, currentUser.id);
        if (existing) {
          return reply.status(409).send({ error: 'email-already-used' });
        }

        db.prepare('UPDATE users SET email = ? WHERE id = ?')
          .run(email, currentUser.id);
        request.session.user.email = email;
      }

      // Changement du mot de passe s'il est fourni
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?')
          .run(hashed, currentUser.id);
      }

      return reply.send({ success: true });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'server-error' });
    }
  });
}
