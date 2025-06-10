import fastify from 'fastify';
import db from './database';

const app = fastify({ logger: true });

// Exemple de route
app.get('/users', async () => {
  const stmt = db.prepare('SELECT * FROM users');
  return stmt.all();
});

// Démarrer le serveur
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Server ready');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();