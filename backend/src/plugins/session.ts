import fp from 'fastify-plugin'
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import 'dotenv/config';


export default fp(async (fastify) => {
  fastify.register(fastifyCookie);

  fastify.register(fastifySession, {
    secret: process.env.SESSION_SECRET!,
    cookieName: 'sessionId', 
    cookie: {
      secure: false, // true si HTTPS
      maxAge: 1000 * 60 * 60 * 24, // durée 1 jour
      sameSite: 'lax' // ✅ Ajoute cette ligne
    },
    saveUninitialized: false,
  });
});