import { FastifyInstance } from 'fastify';
import db from '../database';


export default async function userIdByName(fastify: FastifyInstance){
	fastify.get('/api/userIdByName', async (request, reply) => {
		const {name} = request.query as {name?: string};

		
		if (!name || typeof name !== 'string')
			return reply.status(400).send({ error: 'Invalid player name' });

		const userId = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
		if (!userId) return reply.status(404).send({ error: 'User not found' });
		return userId;
	});
}