import { navigate } from "../main.js";
import { fetchData } from "../tools/fetchData.js";
import { getOnlineUsers, subscribeToStatusUpdates } from "../main.js";
function updateFriendStatusIndicators() {
    const usersOnline = getOnlineUsers();
    const friendsList = document.getElementById('friendsList');
    if (!friendsList)
        return;
    // Pour chaque ami affiché, update la pastille selon sa présence dans usersOnline
    friendsList.querySelectorAll('.friend-item').forEach(friendEl => {
        const friendName = friendEl.getAttribute('data-friend-name');
        if (!friendName)
            return;
        const statusDot = friendEl.querySelector('.status-dot');
        if (!statusDot)
            return;
        if (usersOnline.includes(friendName)) {
            statusDot.style.backgroundColor = 'limegreen'; // en ligne
            statusDot.title = 'En ligne';
        }
        else {
            statusDot.style.backgroundColor = 'lightgray'; // hors ligne
            statusDot.title = 'Hors ligne';
        }
    });
}
export function initProfilSubscriptions() {
    subscribeToStatusUpdates((msg) => {
        if (msg.type === 'user_list') {
            updateFriendStatusIndicators();
            console.log("Utilisateurs en ligne :", getOnlineUsers());
        }
    });
}
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
    <div class="flex pt-[168px] bg-gradient-to-br from-pink-200 via-purple-100 to-blue-200 min-h-screen">
      <!-- Sidebar -->
      <div class="w-1/6 h-[calc(100vh-168px)] fixed left-0 p-4 bg-pink-100 border-r border-pink-300 flex flex-col justify-between pt-[100px] shadow-lg">
        <div>
          <label for="playerName" class="block text-pink-800 mb-2 text-lg font-semibold">Find a player :</label>
          <input
            id="playerName"
            type="text"
            placeholder="Name's player..."
            class="w-full p-2 rounded-xl bg-white text-pink-800 border border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-pink-300"
          />
          <!-- Liste des amis -->
          <div class="mt-6">
            <h2 class="text-pink-700 text-lg font-bold mb-2">My Friends</h2>
            <div id="friendsList" class="max-h-48 overflow-y-auto bg-white p-2 rounded-lg shadow-inner space-y-1">
              <!-- Amis chargés dynamiquement -->
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-4">
          <button id="btn-performance" class="text-xl p-2 bg-purple-300 text-purple-900 rounded-xl shadow hover:bg-purple-400 hover:text-white transition">📈 Perfomances</button>
          <button id="btn-settings" class="text-xl p-2 bg-purple-300 text-purple-900 rounded-xl shadow hover:bg-purple-400 hover:text-white transition">⚙️ Settings</button>
          <button id="btn-deleteUser" class="text-xl p-2 bg-red-300 text-red-800 rounded-xl shadow hover:bg-red-500 hover:text-white transition">🗑️ Delete my account</button>
        </div>
      </div>

      <!-- History -->
      <div id="historyContainer" class="ml-[16.6667%] w-5/6 px-10 py-8">
        <h1 class="text-5xl font-bold text-center text-pink-800 pb-4 border-b-4 border-pink-300 mb-8">${title}</h1>
      </div>
    </div>
  `;
    if (!userId && !invalidUser) {
        console.error('UserId is undefined');
        return;
    }
    const historyContainer = document.getElementById('historyContainer');
    const friendsList = document.getElementById('friendsList');
    let alreadyFriend = false;
    const meRes = await fetch('/api/me', { credentials: 'include' });
    if (meRes.status === 401) {
        navigate('/auth');
        return;
    }
    const me = await meRes.json();
    try {
        const res = await fetch(`/api/friends?userId=${me.id}`, { credentials: 'include' });
        if (res.ok) {
            const friends = await res.json();
            if (friends.length === 0) {
                friendsList.innerHTML = `<p class="text-pink-500 text-sm">No friends yet.</p>`;
            }
            else {
                friendsList.innerHTML = '';
                for (const friend of friends) {
                    const friendEl = document.createElement('div');
                    friendEl.className = 'friend-item flex justify-between items-center text-pink-800 px-3 py-1 rounded-xl bg-pink-100 hover:bg-pink-200 cursor-pointer transition';
                    // Ajoute un attribut data avec le nom de l'ami
                    friendEl.setAttribute('data-friend-name', friend.name);
                    // Crée une pastille (dot) pour le statut
                    const statusDot = document.createElement('span');
                    statusDot.className = 'status-dot rounded-full w-3 h-3 inline-block mr-2';
                    statusDot.style.backgroundColor = 'lightgray'; // par défaut hors ligne
                    statusDot.title = 'Hors ligne';
                    // Crée le span pour le nom et insère la pastille avant
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = friend.name;
                    nameSpan.style.flexGrow = '1';
                    nameSpan.style.display = 'flex';
                    nameSpan.style.alignItems = 'center';
                    nameSpan.style.gap = '0.25rem';
                    // Insère la pastille avant le texte
                    nameSpan.prepend(statusDot);
                    // Clique sur le nom pour naviguer
                    nameSpan.onclick = () => navigate(`/profil?player=${encodeURIComponent(friend.name)}`);
                    friendEl.appendChild(nameSpan);
                    // Bouton supprimer
                    const deleteBtn = document.createElement('span');
                    deleteBtn.textContent = '❌';
                    deleteBtn.title = `Remove ${friend.name}`;
                    deleteBtn.style.cursor = 'pointer';
                    deleteBtn.onclick = async (e) => {
                        e.stopPropagation();
                        if (confirm(`Remove ${friend.name} from your friends?`)) {
                            const res = await fetch('/api/removeFriend', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ friendName: friend.name }),
                                credentials: 'include',
                            });
                            if (res.ok)
                                friendEl.remove();
                            else
                                alert('Error removing friend');
                        }
                    };
                    friendEl.appendChild(deleteBtn);
                    friendsList.appendChild(friendEl);
                    if (playerName && friend.name === playerName) {
                        alreadyFriend = true;
                    }
                }
                // Mets à jour les pastilles de statut après avoir rendu la liste
                updateFriendStatusIndicators();
            }
        }
        else {
            friendsList.innerHTML = `<p class="text-red-400 text-sm">Error loading friends.</p>`;
        }
    }
    catch (err) {
        console.error('Erreur lors du chargement des amis:', err);
        friendsList.innerHTML = `<p class="text-red-400 text-sm">Error loading friends.</p>`;
    }
    if (playerName && !invalidUser && me.name !== playerName && !alreadyFriend) {
        const addFriendBtn = document.createElement('button');
        addFriendBtn.textContent = '➕ Add Friend';
        addFriendBtn.className = 'bg-blue-300 text-blue-900 px-6 py-2 rounded-xl shadow hover:bg-blue-400 hover:text-white transition block mx-auto mb-6';
        addFriendBtn.onclick = async () => {
            const res = await fetch('/api/addFriend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendName: playerName }),
                credentials: 'include'
            });
            if (!res.ok)
                alert('Error adding friend');
            renderProfil(playerName);
        };
        const h1 = historyContainer.querySelector('h1');
        if (h1)
            h1.after(addFriendBtn);
    }
    const gamesDiv = document.createElement('div');
    gamesDiv.id = 'gamesHistory';
    gamesDiv.className = 'flex flex-col gap-6';
    historyContainer.appendChild(gamesDiv);
    if (!invalidUser) {
        try {
            const gamesData = await fetchData('gamesHistory', userId);
            if (!gamesData || gamesData.length === 0) {
                const div = document.createElement('div');
                div.className = 'p-4 rounded-xl text-pink-700 shadow text-2xl bg-white text-center';
                div.textContent = 'No games found...';
                gamesDiv.appendChild(div);
            }
            else {
                for (const game of gamesData) {
                    const gameDiv = document.createElement('div');
                    gameDiv.className = `
            p-6 rounded-2xl shadow-xl hover:scale-105 transform transition
            bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 text-pink-900
          `;
                    const minutes = Math.floor(game.duration / 60);
                    const seconds = game.duration % 60;
                    const durationStr = game.duration
                        ? `${minutes}m${seconds.toString().padStart(2, '0')}s`
                        : 'Not played';
                    const player1 = await fetchData('userNameById', game.player1_id);
                    const player2 = await fetchData('userNameById', game.player2_id);
                    const player1Name = player1?.name || `Deleted account`;
                    const player1Avatar = player1?.avatar || '/avatar/default.png';
                    const player2Name = player2?.name || `Deleted account`;
                    const player2Avatar = player2?.avatar || '/avatar/default.png';
                    let resultText;
                    let scoreClass;
                    if (game.winner_id === me.id) {
                        resultText = '🌸 Victoire';
                        scoreClass = 'text-green-600';
                    }
                    else if (game.player1_score === game.player2_score) {
                        resultText = '⚖️ Egalité';
                        scoreClass = 'text-yellow-600';
                    }
                    else {
                        resultText = '💔 Défaite';
                        scoreClass = 'text-red-600';
                    }
                    gameDiv.innerHTML = `
            <div class="flex items-center gap-6 justify-center">
              <div class="flex flex-col items-center">
                <img src="${player1Avatar}" alt="Avatar 1" class="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
                <span class="mt-2 font-semibold">${player1Name}</span>
              </div>

              <div class="flex flex-col items-center text-3xl font-bold ${scoreClass}">
                ${game.player1_score} - ${game.player2_score}
                <span class="text-sm font-normal mt-1">${resultText}</span>
              </div>

              <div class="flex flex-col items-center">
                <img src="${player2Avatar}" alt="Avatar 2" class="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
                <span class="mt-2 font-semibold">${player2Name}</span>
              </div>
            </div>

            <p class="text-sm mt-4 text-center text-purple-800">
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
            errorDiv.className = 'text-red-500 text-center';
            errorDiv.textContent = 'Error loading game history.';
            gamesDiv.appendChild(errorDiv);
        }
    }
    document.getElementById('btn-settings').onclick = () => navigate('/settings');
    document.getElementById('btn-performance').onclick = () => navigate('/performances');
    const playerNameInput = document.getElementById('playerName');
    playerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const name = playerNameInput.value.trim();
            if (name)
                navigate(`/profil?player=${encodeURIComponent(name)}`);
        }
    });
    document.getElementById('btn-deleteUser').onclick = async () => {
        if (confirm('Are you sure you want to delete your account? This action is irreversible.')) {
            const res = await fetch('/deleteUser', {
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
