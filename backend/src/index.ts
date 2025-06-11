import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import registerRoutes from './routes/register';
import loginRoutes from './routes/login';
import logoutRoutes from './routes/logout';
import session from './plugins/session';
import 'dotenv/config';

const app = Fastify({ logger: true });

app.register(formbody);
app.register(session);

// Routes
app.register(registerRoutes);
app.register(loginRoutes);
app.register(logoutRoutes);

const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
