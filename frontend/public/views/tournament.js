import { navigate } from "../main.js";
export function renderTournament() {
    const app = document.getElementById("app");
    if (!app)
        return;
    // Vérifier si on a des paramètres de joueurs dans l'URL (mode tournoi direct)
    const url = new URL(window.location.href);
    const player1 = url.searchParams.get("player1");
    const player2 = url.searchParams.get("player2");
    const mode = url.searchParams.get("mode");
    // Si on a des joueurs spécifiés et qu'on est en mode tournament, afficher directement le jeu
    if (mode === "tournament" && player1 && player2) {
        // Importer et appeler render1vs1 pour afficher le jeu directement
        import("./1vs1.js").then((module) => {
            module.render1vs1();
        });
        return;
    }
    app.innerHTML = `
    <!-- Conteneur principal avec l'image de fond -->
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
      <!-- Conteneur du formulaire centré -->
      <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
          <!-- Barre violette avec titre -->
          <div class="bg-purple-600 text-pink-100 p-3">
            <h1 class="text-xl font-bold text-center">Tournoi Pong</h1>
          </div>

          <!-- Contenu du formulaire -->
          <div class="p-6">
            <form id="tournament-form" class="space-y-4">
              <div class="flex items-center">
                <label for="player1" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">Joueur 1</label>
                <span class="text-purple-300 mx-1 text-lg">☆</span>
                <input type="text" id="player1" name="player" placeholder="Alias" required 
                      class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
              </div>

              <div class="flex items-center">
                <label for="player2" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">Joueur 2</label>
                <span class="text-purple-300 mx-1 text-lg">☆</span>
                <input type="text" id="player2" name="player" placeholder="Alias" required 
                      class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
              </div>

              <div class="flex items-center">
                <label for="player3" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">Joueur 3</label>
                <span class="text-purple-300 mx-1 text-lg">☆</span>
                <input type="text" id="player3" name="player" placeholder="Alias (optionnel)" 
                      class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
              </div>

              <div class="flex items-center">
                <label for="player4" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">Joueur 4</label>
                <span class="text-purple-300 mx-1 text-lg">☆</span>
                <input type="text" id="player4" name="player" placeholder="Alias (optionnel)" 
                      class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
              </div>

              <div class="pt-4 flex justify-center">
                <button type="submit" 
                        class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                              text-purple-800 font-bold
                              shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                              active:shadow-none active:translate-y-[2px] active:border-purple-300
                              transition-all duration-100">
                  Démarrer le tournoi
                </button>
              </div>
            </form>

            <div id="tournament-preview" class="mt-4 text-center text-pink-500"></div>
          </div>
        </div>
      </div>
    </div>
  `;
    const form = document.getElementById("tournament-form");
    const preview = document.getElementById("tournament-preview");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const players = formData.getAll("player")
            .map(v => String(v).trim())
            .filter(v => v.length > 0);
        if (players.length < 2) {
            if (preview) {
                preview.innerHTML = `<p class="text-red-400">Il faut au moins 2 joueurs pour commencer un tournoi.</p>`;
            }
            return;
        }
        // Génération des matchs
        const matches = [];
        for (let i = 0; i < players.length; i += 2) {
            if (i + 1 < players.length) {
                matches.push({ p1: players[i], p2: players[i + 1] });
            }
            else {
                // joueur sans adversaire = passe automatique
                matches.push({ p1: players[i], p2: "— (qualifié d'office)" });
            }
        }
        // Afficher la page du tournoi
        renderTournamentBracket(players, matches);
    });
}
function renderTournamentBracket(players, matches) {
    const app = document.getElementById("app");
    if (!app)
        return;
    app.innerHTML = `
    <!-- Conteneur principal avec l'image de fond -->
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
      <!-- Conteneur du bracket centré -->
      <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-2xl w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
          <!-- Barre violette avec titre -->
          <div class="bg-purple-600 text-pink-100 p-3">
            <h1 class="text-xl font-bold text-center">Tournoi Pong - Matchs</h1>
          </div>

          <!-- Contenu du bracket -->
          <div class="p-6">
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-purple-600 mb-2">Participants :</h2>
              <ul class="text-purple-800 bg-purple-100 p-3 border border-purple-300">
                ${players.map(p => `
                  <li class="py-1 flex items-center">
                    <span class="text-purple-300 mr-2 text-lg">☆</span>
                    ${p}
                  </li>
                `).join("")}
              </ul>
            </div>

            <div class="mb-6">
              <h2 class="text-lg font-semibold text-purple-600 mb-2">Matchs :</h2>
              <div class="space-y-3">
                ${matches.map((m, i) => `
                  <div class="flex items-center justify-between bg-white p-3 border-2 border-purple-300">
                    <span class="font-semibold text-purple-700">Match ${i + 1}</span>
                    <div class="flex-1 text-center">
                      <span class="font-medium">${m.p1}</span>
                      <span class="mx-2 text-purple-400">vs</span>
                      <span class="font-medium">${m.p2}</span>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="pt-4 flex justify-center">
              <button id="start-tournament" 
                      class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                            text-purple-800 font-bold
                            shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                            active:shadow-none active:translate-y-[2px] active:border-purple-300
                            transition-all duration-100">
                Commencer le premier match
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    // Gestionnaire d'événement pour le bouton "Commencer le premier match"
    document.getElementById("start-tournament")?.addEventListener("click", () => {
        // Récupérer le premier match valide (sans qualification d'office)
        const firstValidMatch = matches.find(match => !match.p2.includes("qualifié d'office"));
        if (firstValidMatch) {
            // Stocker les informations du tournoi pour y accéder plus tard
            localStorage.setItem('tournamentMatches', JSON.stringify(matches));
            localStorage.setItem('currentTournamentMatch', '0');
            // Naviguer vers la page de jeu avec les paramètres
            navigate(`/game?mode=tournament&player1=${encodeURIComponent(firstValidMatch.p1)}&player2=${encodeURIComponent(firstValidMatch.p2)}`);
        }
        else {
            alert("Aucun match valide à commencer.");
        }
    });
}
