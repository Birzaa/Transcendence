import { navigate } from "../main.js";
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
                            <span class="text-purple-300 mr-2">✧</span> 
                            <span data-i18n="Trouverunjoueur">Find a player</span>
                        </label>
                        <div class="flex">
                            <input
                                id="playerName"
                                type="text"
                                data-i18n="Nomplaceholder"
                                placeholder="Name..."
                                class="flex-1 border-2 border-purple-300 px-3 py-2 rounded-none bg-violet-100 focus:border-purple-400"
                            />
                            <button 
                                class="ml-2 px-3 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 text-purple-800">
                                🔍
                            </button>
                        </div>
                    </div>

                    <!-- Liste d'amis -->
                    <div class="bg-purple-100 p-4 border-2 border-purple-300 rounded-lg flex-1">
                        <h2 class="text-purple-800 font-bold mb-3 flex items-center">
                            <span class="text-purple-300 mr-2">☆</span> 
                            <span data-i18n="Mesamis">My Friends</span>
                        </h2>
                        <div id="friendsList" class="bg-violet-100 p-2 h-[200px] overflow-y-auto space-y-2 border-2 border-purple-300">
                            <!-- Amis chargés dynamiquement -->
                        </div>
                    </div>

                    <!-- Boutons -->
                    <div class="space-y-3">
                        <button id="btn-settings" 
                            class="w-full relative px-4 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                            text-purple-800 font-bold
                            shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                            hover:bg-purple-300
                            active:shadow-none active:translate-y-[2px] active:border-purple-300
                            transition-all duration-100"
                            data-i18n="Parametres">
                            ⚙️ Settings
                        </button>
                        <button id="btn-deleteUser" 
                            class="w-full relative px-4 py-2 bg-pink-200 border-2 border-t-white border-l-white border-r-pink-400 border-b-pink-400 
                            text-pink-800 font-bold
                            shadow-[2px_2px_0px_0px_rgba(219,39,119,0.3)]
                            hover:bg-pink-300
                            active:shadow-none active:translate-y-[2px] active:border-pink-300
                            transition-all duration-100"
                            data-i18n="Supprimercompte">
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
                                <p class="text-xl" data-i18n="Joueurintrouvable">Player not found (´；ω；｀)</p>
                            </div>
                        ` : '<div class="col-span-2 text-center text-purple-500" data-i18n="Chargementparties">Loading game history... ☆</div>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}
