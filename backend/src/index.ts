import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import registerRoutes from './routes/register';
import loginRoutes from './routes/login';
import logoutRoutes from './routes/logout';
import session from './plugins/session';
import fastifyStatic from '@fastify/static';
import path from 'path';
import 'dotenv/config';

const app = Fastify({ logger: true });

app.register(formbody);
app.register(session);

// Routes
app.register(registerRoutes);
app.register(loginRoutes);
app.register(logoutRoutes);

app.register(fastifyStatic, {
  root: path.join(__dirname, '../public'), // ← chemin correct
  prefix: '/',
  wildcard: true
})

app.setNotFoundHandler((req, reply) => {
  reply.type('text/html').sendFile('index.html'); // SPA
});

const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
