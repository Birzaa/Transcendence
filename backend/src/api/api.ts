import { FastifyInstance } from 'fastify';
import db from '../database';


export default async function apiRoutes(fastify: FastifyInstance){
	fastify.get('/api/data', async (request, reply) => {
		const query = request.query as { type?: string; userId?: string};

		switch (query.type) {
			case 'profile':
				if (!query.userId){
					return reply.status(400).send({ error: 'Missing userId' });
				}
				const profile = db.prepare('SELECT id, name as username, email FROM users WHERE id = ?').get(query.userId);
				if (!profile) return reply.status(404).send({ error: 'User not found' });
				return profile;

			case 'gamesHistory':
				if (!query.userId) {
					return reply.status(400).send({ error: 'Missing userId' });
				}
				const games = db.prepare(`
					SELECT *
					FROM games
					WHERE player1_id = ? OR player2_id = ?
					ORDER BY created_at DESC
				`).all(query.userId, query.userId);
				return games;

			case 'userNameById':
				if (!query.userId) {
					return reply.status(400).send({ error: 'Missing userId' });
				}
				const user = db.prepare('SELECT name AS name, avatar FROM users WHERE id = ?').get(query.userId);
				if (!user) return reply.status(404).send({ error: 'User not found' });
				return user;

			default:
				return reply.status(400).send({ error: 'Unknown query type' });
		}

	});
}