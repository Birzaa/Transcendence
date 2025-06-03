import Fastify from 'fastify';

const server = Fastify();

server.get('/', async () => {
  return { message: 'Hello from Fastify!' };
});

server.listen({ port: 4000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 Fastify server is running at ${address}`);
});
