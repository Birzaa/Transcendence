import { navigate } from "../main.js";
import { fetchData } from "../tools/fetchData.js";
export async function renderProfil(playerName) {
    let userId;
    let invalidUser = false;
    let avatarUrl;
    if (playerName) {
        const res = await fetch(`/api/userIdByName?name=${encodeURIComponent(playerName)}`);
        if (res.ok) {
            const player = await res.json();
            userId = player.id;
            avatarUrl = player.avatar;
        }
        else {
            invalidUser = true;
        }
    }
    else {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (res.status === 401) {
            navigate('/auth');
            return;
        }
        const user = await res.json();
        userId = user.id;
        avatarUrl = user.avatar;
    }
    const app = document.getElementById('app');
    const title = invalidUser
        ? `${playerName} not found`
        : playerName
            ? `${playerName}'s game history`
            : `My game history`;
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
					<!-- Liste des amis -->
					<div class="mt-6">
						<h2 class="text-white text-lg font-semibold mb-2">My Friends</h2>
						<div id="friendsList" class="max-h-48 overflow-y-auto bg-gray-800 p-2 rounded scroll-smooth">
							<!-- Amis chargés dynamiquement -->
						</div>
					</div>
				</div>
				<div class="flex flex-col gap-4">
					<button id="btn-settings" class="text-xl p-2 bg-purple-600 rounded-lg shadow-md hover:bg-purple-800">Settings</button>
					<button id="btn-deleteUser" class="text-xl p-2 bg-red-600 rounded-lg shadow-md hover:bg-red-800">Delete my account</button>
				</div>
			</div>

			<!-- History -->
			<div id="historyContainer" class="ml-[16.6667%] w-5/6 bg-slate-600 min-h-screen px-10 py-8">
				<h1 class="text-5xl font-bold text-center text-white pb-4 border-b-2 border-white mb-8">${title}</h1>
			</div>
		</div>
	`;
    if (!userId) {
        console.error('UserId is undefined');
        return;
    }
    const historyContainer = document.getElementById('historyContainer');
    const friendsList = document.getElementById('friendsList');
    let alreadyFriend = false;
    // Récupérer le user connecté pour charger ses amis et contrôler bouton "Add Friend"
    const meRes = await fetch('/api/me', { credentials: 'include' });
    if (meRes.status === 401) {
        navigate('/auth');
        return;
    }
    const me = await meRes.json();
    // Charger la liste des amis DE L'UTILISATEUR CONNECTÉ
    try {
        const res = await fetch(`/api/friends?userId=${me.id}`, { credentials: 'include' });
        if (res.ok) {
            const friends = await res.json(); // [{id, name}]
            if (friends.length === 0) {
                friendsList.innerHTML = `<p class="text-white text-sm">No friends yet.</p>`;
            }
            else {
                friendsList.innerHTML = ''; // reset la liste
                for (const friend of friends) {
                    const friendEl = document.createElement('div');
                    friendEl.className = 'flex justify-between items-center text-white py-1 px-2 hover:bg-gray-700 rounded cursor-pointer';
                    // Nom ami cliquable pour aller sur profil
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = friend.name;
                    nameSpan.style.flexGrow = '1';
                    nameSpan.onclick = () => navigate(`/profil?player=${encodeURIComponent(friend.name)}`);
                    friendEl.appendChild(nameSpan);
                    // Emoji poubelle pour supprimer l'ami
                    const deleteBtn = document.createElement('span');
                    deleteBtn.textContent = '🗑️';
                    deleteBtn.style.cursor = 'pointer';
                    deleteBtn.title = `Remove ${friend.name} from friends`;
                    deleteBtn.onclick = async (e) => {
                        e.stopPropagation(); // éviter navigation au clic sur delete
                        if (confirm(`Are you sure you want to remove ${friend.name} from your friends?`)) {
                            const res = await fetch('/api/removeFriend', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ friendName: friend.name }),
                                credentials: 'include',
                            });
                            if (res.ok) {
                                friendEl.remove();
                            }
                            else {
                                alert('Error removing friend');
                            }
                        }
                    };
                    friendEl.appendChild(deleteBtn);
                    friendsList.appendChild(friendEl);
                    // Vérifie si le joueur affiché est déjà un ami
                    if (playerName && friend.name === playerName) {
                        alreadyFriend = true;
                    }
                }
            }
        }
        else {
            friendsList.innerHTML = `<p class="text-white text-sm">Error loading friends.</p>`;
        }
    }
    catch (err) {
        console.error('Erreur lors du chargement des amis:', err);
        friendsList.innerHTML = `<p class="text-white text-sm">Error loading friends.</p>`;
    }
    // Ajouter le bouton "Add Friend" si ce n'est pas toi ni déjà un ami
    if (playerName && !invalidUser) {
        if (me.name !== playerName && !alreadyFriend) {
            const addFriendBtn = document.createElement('button');
            addFriendBtn.textContent = 'Add Friend';
            addFriendBtn.className = 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 mb-6 block mx-auto';
            addFriendBtn.onclick = async () => {
                const res = await fetch('/api/addFriend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ friendName: playerName }),
                    credentials: 'include'
                });
                if (!res.ok) {
                    alert('Error adding friend');
                }
                renderProfil(playerName); // Refresh profile after adding
            };
            const h1 = historyContainer.querySelector('h1');
            if (h1)
                h1.after(addFriendBtn);
            else
                console.warn('H1 introuvable pour insérer le bouton');
        }
    }
    // Zone d'affichage des parties
    const gamesDiv = document.createElement('div');
    gamesDiv.id = 'gamesHistory';
    gamesDiv.className = 'flex flex-col gap-4';
    historyContainer.appendChild(gamesDiv);
    if (!invalidUser) {
        try {
            const gamesData = await fetchData('gamesHistory', userId);
            if (!gamesData || gamesData.length === 0) {
                const div = document.createElement('div');
                div.className = 'p-4 rounded text-white shadow-md text-2xl';
                div.textContent = 'No games found...';
                gamesDiv.appendChild(div);
            }
            else {
                for (const game of gamesData) {
                    const gameDiv = document.createElement('div');
                    gameDiv.className = `
						p-6 rounded-2xl shadow-xl transition-transform transform hover:scale-105
						bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 text-white
					`;
                    const minutes = Math.floor(game.duration / 60);
                    const seconds = game.duration % 60;
                    const durationStr = game.duration
                        ? `${minutes}m${seconds.toString().padStart(2, '0')}s`
                        : 'Not played';
                    // Récupérer les deux joueurs
                    const player1 = await fetchData('userNameById', game.player1_id);
                    const player2 = await fetchData('userNameById', game.player2_id);
                    // Fallback si joueur supprimé
                    const player1Name = player1?.name || `#${game.player1_id} (Inconnu)`;
                    const player1Avatar = player1?.avatar || '/avatar/default.png';
                    console.log(player1Name, player1Avatar);
                    const player2Name = player2?.name || `#${game.player2_id} (Inconnu)`;
                    const player2Avatar = player2?.avatar || '/avatar/default.png';
                    // Couleur et texte résultat pour joueur connecté
                    let resultText = 'Pending';
                    let scoreClass = 'text-yellow-300';
                    if (game.winner_id) {
                        if (game.winner_id === me.id) {
                            resultText = 'Victoire';
                            scoreClass = 'text-green-400';
                        }
                        else if (game.winner_id === null) {
                            resultText = 'Nulle';
                            scoreClass = 'text-yellow-300';
                        }
                        else {
                            resultText = 'Défaite';
                            scoreClass = 'text-red-500';
                        }
                    }
                    gameDiv.innerHTML = `
						<div class="flex items-center gap-6 justify-center">
							<div class="flex flex-col items-center">
								<img src="${player1Avatar}" alt="Avatar joueur 1" class="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
								<span class="text-white mt-2">${player1Name}</span>
							</div>

							<div class="flex flex-col items-center text-3xl font-bold ${scoreClass}">
								${game.player1_score} - ${game.player2_score}
								<span class="text-sm font-normal mt-1">${resultText}</span>
							</div>

							<div class="flex flex-col items-center">
								<img src="${player2Avatar}" alt="Avatar joueur 2" class="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
								<span class="text-white mt-2">${player2Name}</span>
							</div>
						</div>

						<p class="text-sm mt-3 text-center">
							Jouée le : <span class="font-semibold">${new Date(game.created_at).toLocaleString()}</span><br/>
							Durée : <span class="font-semibold">${durationStr}</span>
						</p>
					`;
                    gamesDiv.appendChild(gameDiv);
                }
            }
        }
        catch (err) {
            console.error('Erreur chargement parties:', err);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'text-white';
            errorDiv.textContent = 'Error loading game history.';
            gamesDiv.appendChild(errorDiv);
        }
    }
    // Gérer bouton Settings
    document.getElementById('btn-settings').onclick = () => navigate('/settings');
    // Gérer bouton supprimer compte
    document.getElementById('btn-deleteUser').onclick = async () => {
        if (confirm('Are you sure you want to delete your account? This action is irreversible.')) {
            const res = await fetch('/api/deleteUser', {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                navigate('/auth');
            }
            else {
                alert('Error deleting account');
            }
        }
    };
}
