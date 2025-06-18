import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import registerRoutes from './routes/register';
import loginRoutes from './routes/login';
import logoutRoutes from './routes/logout';
import twoFARoutes from './routes/twofa';
import apiRoutes from './api/api';
import meRoute from './api/me';
import userIdByName from './api/userIdByName';
import removeFriend from './api/removeFriend';
import addFriend from './api/addFriend';
import friendList from './api/friendList';
import session from './plugins/session';
import fastifyStatic from '@fastify/static';
import path from 'path';
import setupWebSocket from './ws';
import 'dotenv/config';

const app = Fastify({ logger: true });

async function start() {
  app.register(formbody);
  app.register(session);

  // Routes
  await app.register(registerRoutes);
  await app.register(loginRoutes);
  await app.register(logoutRoutes);
  await app.register(apiRoutes);
  await app.register(userIdByName);
  await app.register(meRoute);
  await app.register(friendList);
  await app.register(addFriend);
  await app.register(removeFriend);
  await app.register(twoFARoutes);

  app.register(fastifyStatic, {
    root: '/app/public', // attention ici : vérifie si ce chemin est correct dans ton conteneur
    prefix: '/',
    wildcard: true
  });

  app.setNotFoundHandler((req, reply) => {
    reply.type('text/html').sendFile('index.html'); // SPA
  });

  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    await setupWebSocket(app);
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    app.log.error(err);
  }
}


start();



