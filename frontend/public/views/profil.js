import { fetchData } from "../tools/fetchData.js";
import { renderAuth } from "../views/auth.js";
export async function renderProfil(playerName) {
    // Verification de connexion + definition de l'user ID
    let userId;
    let invalidUSer = false;
    if (playerName) {
        const res = await fetch(`/api/userIdByName?name=${encodeURIComponent(playerName)}`);
        if (res.ok) {
            const player = await res.json();
            userId = player.id;
        }
        else {
            invalidUSer = true;
        }
    }
    else {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.status === 401) {
            renderAuth();
            return;
        }
        const user = await res.json();
        userId = user.id;
    }
    const app = document.getElementById('app');
    app.innerHTML = `
		<div class="flex pt-[168px] bg-pink-400">
			<!-- Sidebar -->
			<div class="w-1/6 h-[calc(100vh-168px)] fixed left-0 p-4 bg-slate-700 flex flex-col justify-between pt-[100px]">
				<div>
					<label for="playerName" class="block text-white mb-2 text-lg font-semibold">Find a player :</label>
					<input
						id="playerName"
						type="text"
						placeholder="Name's player..."
						class="w-full p-2 rounded bg-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
					/>
				</div>
				<div class="flex flex-col gap-4">
					<button class="text-xl p-2 bg-purple-600 rounded-lg shadow-md hover:bg-purple-800">Settings</button>
					<button class="text-xl p-2 bg-red-600 rounded-lg shadow-md hover:bg-red-800">Delete my account</button>
				</div>
			</div>

			<!-- History -->
			<div class="ml-[16.6667%] w-5/6 bg-slate-600 min-h-screen px-10 py-8">
				<h1 class="text-5xl font-bold text-center text-white pb-4 border-b-2 border-white mb-8">
					${invalidUSer
        ? playerName + ` not found`
        : (playerName ? playerName + `'s ` : `My `)}
					${invalidUSer
        ? ``
        : `game history`}
				</h1>
				<div class="flex flex-col gap-4" id=gamesHistory></div>
			</div>
		</div>
	`;
    if (!userId) {
        console.error('UserId is undefined');
        return;
    }
    console.log(userId);
    const games = document.getElementById('gamesHistory');
    if (!invalidUSer) {
        try {
            const gamesData = await fetchData('gamesHistory', userId);
            // if (!gamesData || gamesData.length === 0) {
            // 		const div = document.createElement('div');
            // 		div.className = 'p-4 rounded text-white shadow-md text-2xl';
            // 		div.textContent = 'No games found...';
            // 		games.appendChild(div);
            if (userId) { // TEST
                // Afficher les parties
                const gamesDatas = [
                    {
                        id: 1,
                        player1_id: 10,
                        player2_id: 15,
                        player1_score: 3,
                        player2_score: 1,
                        winner_id: 10,
                        duration: 1200,
                    },
                    {
                        id: 2,
                        player1_id: 15,
                        player2_id: 20,
                        player1_score: 0,
                        player2_score: 3,
                        winner_id: 20,
                        duration: 900,
                    },
                ];
                let i = 0;
                for (const game of gamesDatas) {
                    const gameDiv = document.createElement('div');
                    // Applique une classe couleur selon victoire ou défaite
                    if (i === 0)
                        gameDiv.className = 'p-4 rounded bg-green-700 text-white shadow-md'; // vert pour victoire
                    else if (i === 1)
                        gameDiv.className = 'p-4 rounded bg-red-700 text-white shadow-md'; // rouge pour défaite
                    const minutes = Math.floor(game.duration / 60);
                    const seconds = game.duration % 60;
                    const durationStr = `${minutes}m${seconds.toString().padStart(2, '0')}s`;
                    gameDiv.innerHTML = `
					<h2 class="text-xl font-bold mb-2">Game #${game.id}</h2>
					<p>Player 1 (ID ${game.player1_id}) score: ${game.player1_score}</p>
					<p>Player 2 (ID ${game.player2_id}) score: ${game.player2_score}</p>
					<p>Winner: Player with ID ${game.winner_id}</p>
					<p>Duration: ${durationStr}</p>
				`;
                    games.appendChild(gameDiv);
                    i++;
                }
            }
        }
        catch (err) {
            console.error('Erreur lors du chargement des parties :', err);
            const div = document.createElement('div');
            div.className = 'p-4 rounded text-white shadow-md text-2xl';
            div.textContent = 'Error loading games...';
            games.appendChild(div);
        }
    }
    // Rechercher les joueurs 
    document.getElementById('playerName')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const input = e.target;
            const name = input.value.trim();
            if (name)
                renderProfil(name);
        }
    });
}
