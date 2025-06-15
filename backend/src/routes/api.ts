import { FastifyInstance } from 'fastify';
import db from '../database';


export default async function apiRoutes(fastify: FastifyInstance){
	fastify.get('/api/data', async (request, reply) => {
		const query = request.query as { type?: string; userId?: string};

		switch (query.type) {
			case 'profile':
				if (!query.userId){
					return reply.status(400).send({ error: 'Missing userID'});
				}
				const profile = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(query.userId);
				if (!profile) return reply.status(404).send({ error: 'User not found' });
				return profile;
			
			case 'gamesHistory':
				if (!query.userId) {
					return reply.status(400).send({ error: 'Missing userId' });
				}
				const games = db.prepare('SELECT * FROM games WHERE user_id = ?').all(query.userId);
				return games;
			
			default:
				return reply.status(400).send({ error: 'Unknown query type' });
		}
	});
}