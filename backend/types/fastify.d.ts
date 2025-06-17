import 'fastify';
import 'fastify-session';

declare module 'fastify' {
  interface Session {
    user?: {
      id: number;
      name: string;
      email: string;
      avatar: string;
    };
  }
}