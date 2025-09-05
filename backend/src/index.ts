import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import registerRoutes from './routes/register';
import loginRoutes from './routes/login';
import logoutRoutes from './routes/logout';
import apiRoutes from './api/api';
import meRoute from './api/me';
import userIdByName from './api/userIdByName';
import removeFriend from './api/removeFriend';
import addFriend from './api/addFriend';
import friendList from './api/friendList';
import session from './plugins/session';
import fastifyStatic from '@fastify/static';
import path from 'path';
import 'dotenv/config';
import multipart from '@fastify/multipart';
import updateAvatar from './api/udapteAvatar';
import updateSettings from './api/updateSettings';
import deleteUserRoute from './routes/deleteUser';
import myStats from './api/myStats';
import setupWebSocket from './routes/ws';
import fs from 'fs';

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
};

const app = Fastify({ logger: true, https: httpsOptions, });

async function start() {
  await app.register(setupWebSocket);

  app.register(formbody);
  app.register(session);
  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  // Autres routes...
  await app.register(registerRoutes);
  await app.register(loginRoutes);
  await app.register(logoutRoutes);
  await app.register(deleteUserRoute);
  await app.register(apiRoutes);
  await app.register(userIdByName);
  await app.register(meRoute);
  await app.register(friendList);
  await app.register(addFriend);
  await app.register(removeFriend);
  await app.register(updateAvatar);
  await app.register(updateSettings);
  await app.register(myStats);

  // Statics
  app.register(fastifyStatic, {
    root: '/app/public',
    prefix: '/',
    wildcard: true
  });

  app.setNotFoundHandler((req, reply) => {
    reply.type('text/html').sendFile('index.html');
  });

  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on https://localhost:3001');
  } catch (err) {
    app.log.error(err);
  }
}


start();
