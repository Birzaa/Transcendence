import { FastifyInstance } from 'fastify';
import db from '../database';

export default async function meRoute(app: FastifyInstance) {
	app.get('/api/myStats', async (req, res) => {
	const userId = req.session.user.id; // ou autre système d'auth
	if (!userId) return res.status(401).send({ error: 'Unauthorized' });

	const games = db.prepare(`SELECT * FROM games WHERE player1_id = ? OR player2_id = ?`).all(userId, userId);

	let wins = 0, losses = 0, draws = 0;
	for (const g of games) {
		if (g.player2_score === g.player1_score) draws++;
		else if (g.winner_id == userId) wins++;
		else losses++;
	}
	const total = games.length;
	const winrate = total ? Math.round((wins / total) * 100) : 0;

	return { total, wins, losses, draws, winrate };
});
}