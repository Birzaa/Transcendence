import { FastifyInstance } from 'fastify';
import db from '../database';

export default async function addGame(fastify: FastifyInstance) {
  fastify.post('/api/addGame', async (request, reply) => {
    try {
      const { player1, player2, player1Score, player2Score, duration } = request.body as {
        player1: string;
        player2: string;
        player1Score: number;
        player2Score: number;
        duration?: number;
      };

      if (!player1 || !player2 || player1Score == null || player2Score == null) {
        return reply.status(400).send({ error: 'Missing required fields' });
      }

      // On tente de récupérer l'ID (si le joueur est un compte enregistré)
      const p1 = db.prepare('SELECT id FROM users WHERE name = ?').get(player1) as { id?: number } | undefined;
      const p2 = db.prepare('SELECT id FROM users WHERE name = ?').get(player2) as { id?: number } | undefined;

      const player1_id = p1?.id ?? null;
      const player2_id = p2?.id ?? null;

      // Déterminer winner_id si possible (égalité -> null)
      let winnerId: number | null = null;
      if (player1Score > player2Score) winnerId = player1_id ?? null;
      else if (player2Score > player1Score) winnerId = player2_id ?? null;

      const stmt = db.prepare(`
        INSERT INTO games
          (player1_id, player2_id, player1_name, player2_name, player1_score, player2_score, winner_id, duration)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        player1_id,
        player2_id,
        player1,
        player2,
        player1Score,
        player2Score,
        winnerId,
        duration ?? 0
      );

      return { success: true, gameId: result.lastInsertRowid };
    } catch (err) {
      console.error('addGame error:', err);
      return reply.status(500).send({ error: 'Failed to save game' });
    }
  });
}
