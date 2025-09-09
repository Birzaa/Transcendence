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
        ? `${playerName} not found (´；ω；｀)`
        : playerName
            ? `${playerName}'s game history ☆`
            : `My game history ☆`;
    app.innerHTML = `
        <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4 pt-[168px]">
            <div class="flex">
                <!-- Sidebar - Style kawaii -->
                <div class="w-1/5 h-[calc(100vh-168px)] fixed left-0 p-4 bg-pink-50 bg-opacity-90 border-r-2 border-purple-300 shadow-lg flex flex-col space-y-6">
                    <!-- Recherche de joueur -->
                    <div class="bg-purple-100 p-4 border-2 border-purple-300 rounded-lg">
                        <label for="playerName" class="block text-purple-800 mb-2 font-bold flex items-center">
                            <span class="text-purple-300 mr-2">✧</span> Find a player
                        </label>
                        <div class="flex">
                            <input
                                id="playerName"
                                type="text"
                                placeholder="Name..."
                                class="flex-1 border-2 border-purple-300 px-3 py-2 rounded-none bg-violet-100 focus:border-purple-400"
                            />
                            <button class="ml-2 px-3 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 text-purple-800">
                                🔍
                            </button>
                        </div>
                    </div>

                    <!-- Liste d'amis -->
                    <div class="bg-purple-100 p-4 border-2 border-purple-300 rounded-lg flex-1">
                        <h2 class="text-purple-800 font-bold mb-3 flex items-center">
                            <span class="text-purple-300 mr-2">☆</span> My Friends
                        </h2>
                        <div id="friendsList" class="bg-violet-100 p-2 h-[200px] overflow-y-auto space-y-2 border-2 border-purple-300">
                            <!-- Amis chargés dynamiquement -->
                        </div>
                    </div>

                    <!-- Boutons -->
                    <div class="space-y-3">
                        <button id="btn-settings" class="w-full relative px-4 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                            text-purple-800 font-bold
                            shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                            hover:bg-purple-300
                            active:shadow-none active:translate-y-[2px] active:border-purple-300
                            transition-all duration-100">
                            ⚙️ Settings
                        </button>
                        <button id="btn-deleteUser" class="w-full relative px-4 py-2 bg-pink-200 border-2 border-t-white border-l-white border-r-pink-400 border-b-pink-400 
                            text-pink-800 font-bold
                            shadow-[2px_2px_0px_0px_rgba(219,39,119,0.3)]
                            hover:bg-pink-300
                            active:shadow-none active:translate-y-[2px] active:border-pink-300
                            transition-all duration-100">
                            🗑️ Delete Account
                        </button>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="ml-[20%] w-4/5 p-6">
                    <!-- Titre -->
                    <div class="bg-purple-600 text-pink-100 p-3 mb-8 rounded-lg">
                        <h1 class="text-2xl font-bold text-center">${title}</h1>
                    </div>

                    <!-- Bouton Add Friend conditionnel -->
                    <div id="addFriendContainer"></div>

                    <!-- Historique des parties -->
                    <div id="gamesHistory" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${invalidUser ? `
                            <div class="col-span-2 bg-baby-pink border-l-4 border-baby-pink-dark text-purple-800 p-6 text-center rounded-lg">
                                <p class="text-xl">Player not found (´；ω；｀)</p>
                            </div>
                        ` : '<div class="col-span-2 text-center text-purple-500">Loading game history... ☆</div>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    if (!userId && !invalidUser) {
        console.error('UserId is undefined');
        return;
    }
    const historyContainer = document.getElementById('gamesHistory');
    const friendsList = document.getElementById('friendsList');
    const addFriendContainer = document.getElementById('addFriendContainer');
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
                friendsList.innerHTML = `<p class="text-purple-500 text-center italic">No friends yet. (´• ω •｀)</p>`;
            }
            else {
                friendsList.innerHTML = '';
                for (const friend of friends) {
                    const friendEl = document.createElement('div');
                    friendEl.className = 'flex justify-between items-center p-2 bg-pink-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition';
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'text-purple-700 cursor-pointer hover:underline flex items-center';
                    nameSpan.innerHTML = `
                        <span class="text-purple-300 mr-2">✧</span>
                        ${friend.name}
                    `;
                    nameSpan.onclick = () => navigate(`/profil?player=${encodeURIComponent(friend.name)}`);
                    friendEl.appendChild(nameSpan);
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'text-pink-500 hover:text-red-500 p-1 transition';
                    deleteBtn.innerHTML = '✕';
                    deleteBtn.title = `Remove ${friend.name}`;
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
            }
        }
        else {
            friendsList.innerHTML = `<p class="text-red-400 text-center">Error loading friends (´；д；｀)</p>`;
        }
    }
    catch (err) {
        console.error('Error loading friends:', err);
        friendsList.innerHTML = `<p class="text-red-400 text-center">Error loading friends (´；д；｀)</p>`;
    }
    if (playerName && !invalidUser && me.name !== playerName && !alreadyFriend) {
        addFriendContainer.innerHTML = `
            <button id="addFriendBtn" class="relative px-6 py-2 bg-baby-blue border-2 border-t-white border-l-white border-r-blue-400 border-b-blue-400 
                text-blue-800 font-bold mb-6 mx-auto block
                shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)]
                hover:bg-blue-300
                active:shadow-none active:translate-y-[2px] active:border-blue-300
                transition-all duration-100">
                ✨ Add Friend
            </button>
        `;
        document.getElementById('addFriendBtn')?.addEventListener('click', async () => {
            const res = await fetch('/api/addFriend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendName: playerName }),
                credentials: 'include'
            });
            if (!res.ok) {
                alert('Error adding friend');
            }
            else {
                renderProfil(playerName);
            }
        });
    }
    if (!invalidUser) {
        try {
            const gamesData = await fetchData('gamesHistory', userId);
            historyContainer.innerHTML = '';
            if (!gamesData || gamesData.length === 0) {
                const div = document.createElement('div');
                div.className = 'col-span-2 bg-white bg-opacity-80 p-6 rounded-xl text-purple-700 shadow text-center border-2 border-purple-200';
                div.innerHTML = `
                    <p class="text-xl">No games found yet... (´• ω •｀)</p>
                    <p class="mt-2 text-sm">Play your first game!</p>
                `;
                historyContainer.appendChild(div);
            }
            else {
                for (const game of gamesData) {
                    const minutes = Math.floor(game.duration / 60);
                    const seconds = game.duration % 60;
                    const durationStr = game.duration
                        ? `${minutes}m${seconds.toString().padStart(2, '0')}s`
                        : 'Not finished';
                    const player1 = await fetchData('userNameById', game.player1_id);
                    const player2 = await fetchData('userNameById', game.player2_id);
                    const player1Name = player1?.name || `Deleted account`;
                    const player1Avatar = player1?.avatar || '/images/default-avatar.png';
                    const player2Name = player2?.name || `Deleted account`;
                    const player2Avatar = player2?.avatar || '/images/default-avatar.png';
                    const isWinner = game.winner_id === me.id;
                    const isDraw = game.winner_id === null;
                    const gameDiv = document.createElement('div');
                    gameDiv.className = `bg-pink-50 bg-opacity-90 border-2 ${isWinner ? 'border-green-300' : isDraw ? 'border-yellow-300' : 'border-purple-300'} p-4 rounded-lg shadow-md hover:shadow-lg transition-all`;
                    gameDiv.innerHTML = `
                        <div class="flex items-center justify-around mb-4">
                            <div class="text-center">
                                <img src="${player1Avatar}" 
                                     class="w-16 h-16 rounded-full border-2 ${game.player1_id === me.id ? 'border-purple-400' : 'border-purple-200'} shadow-md">
                                <p class="mt-2 font-semibold ${game.winner_id === game.player1_id ? 'text-green-600' : 'text-purple-700'}">
                                    ${player1Name} ${game.player1_id === me.id ? '(You)' : ''}
                                </p>
                            </div>
                            
                            <div class="text-2xl font-bold mx-4 px-4 py-2 bg-purple-100 rounded-lg border-2 ${isWinner ? 'border-green-300 bg-green-50' :
                        isDraw ? 'border-yellow-300 bg-yellow-50' : 'border-purple-300'}">
                                ${game.player1_score} - ${game.player2_score}
                                ${isWinner ? '<div class="text-xs text-green-600">Victory! ☆</div>' :
                        isDraw ? '<div class="text-xs text-yellow-600">Draw</div>' :
                            '<div class="text-xs text-red-500">Defeat</div>'}
                            </div>
                            
                            <div class="text-center">
                                <img src="${player2Avatar}" 
                                     class="w-16 h-16 rounded-full border-2 ${game.player2_id === me.id ? 'border-purple-400' : 'border-purple-200'} shadow-md">
                                <p class="mt-2 font-semibold ${game.winner_id === game.player2_id ? 'text-green-600' : 'text-purple-700'}">
                                    ${player2Name} ${game.player2_id === me.id ? '(You)' : ''}
                                </p>
                            </div>
                        </div>
                        
                        <div class="text-center text-sm text-purple-700 bg-purple-100 p-2 rounded-lg">
                            <p>Played on: <span class="font-semibold">${new Date(game.created_at).toLocaleString()}</span></p>
                            <p class="mt-1">Duration: <span class="font-semibold">${durationStr}</span></p>
                        </div>
                    `;
                    historyContainer.appendChild(gameDiv);
                }
            }
        }
        catch (err) {
            console.error('Error loading game history:', err);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'col-span-2 text-red-500 text-center bg-red-50 p-4 rounded-lg border-2 border-red-200';
            errorDiv.innerHTML = `
                <p>Error loading game history (´；д；｀)</p>
                <p class="text-sm mt-2">Please try again later</p>
            `;
            historyContainer.appendChild(errorDiv);
        }
    }
    // Gestion des événements
    document.getElementById('btn-settings')?.addEventListener('click', () => navigate('/settings'));
    const playerNameInput = document.getElementById('playerName');
    playerNameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const name = playerNameInput.value.trim();
            if (name)
                navigate(`/profil?player=${encodeURIComponent(name)}`);
        }
    });
    document.getElementById('btn-deleteUser')?.addEventListener('click', async () => {
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
    });
}
