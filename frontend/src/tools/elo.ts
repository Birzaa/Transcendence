type Game = {
  created_at: string;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
};

export function elo(userId: number, games: Game[]) {
  let elo = 500;
  const history: { date: string; elo: number }[] = [];

  // Trier par date pour une évolution cohérente
  games.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const g of games) {
    const isDraw = g.player1_score === g.player2_score;
    const didWin =
      (g.player1_id === userId && g.player1_score > g.player2_score) ||
      (g.player2_id === userId && g.player2_score > g.player1_score);

    if (isDraw) {
      elo += 5;  // petit gain en cas d'égalité
    } else if (didWin) {
      elo += 25; // gain important en cas de victoire
    } else {
      elo -= 25; // perte en cas de défaite
    }

    // Optionnel : éviter que l'Elo descende sous un seuil, par ex. 100
    if (elo < 0) elo = 0;

    history.push({ date: g.created_at, elo });
  }

  return history;
}
