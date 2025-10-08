import { navigate } from "../main.js";
export function renderTournament() {
    const app = document.getElementById("app");
    if (!app)
        return;
    const url = new URL(window.location.href);
    const player1 = url.searchParams.get("player1");
    const player2 = url.searchParams.get("player2");
    const mode = url.searchParams.get("mode");
    if (mode === "tournament" && player1 && player2) {
        import("./1vs1.js").then((module) => {
            module.render1vs1();
        });
        return;
    }
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
      <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
          <div class="bg-purple-600 text-pink-100 p-3">
            <h1 class="text-xl font-bold text-center" data-i18n="Tournament_Title">Tournoi Pong</h1>
          </div>
          <div class="p-6">
            <form id="tournament-form" class="space-y-4">
              ${[1, 2, 3, 4].map(i => `
                <div class="flex items-center">
                  <label for="player${i}" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32" data-i18n="Tournament_Player">Joueur ${i}</label>
                  <span class="text-purple-300 mx-1 text-lg">☆</span>
                  <input type="text" id="player${i}" name="player" placeholder="Alias${i > 2 ? ' (optionnel)' : ''}" ${i <= 2 ? 'required' : ''}
                        class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
                </div>
              `).join("")}
              <div class="pt-4 flex justify-center">
                <button type="submit"
                        class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                              text-purple-800 font-bold
                              shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                              active:shadow-none active:translate-y-[2px] active:border-purple-300
                              transition-all duration-100"
                        data-i18n="Tournament_Start">
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
                preview.innerHTML = `<p class="text-red-400" data-i18n="Tournament_MinPlayers">Il faut au moins 2 joueurs pour commencer un tournoi.</p>`;
            }
            return;
        }
        const matches = [];
        for (let i = 0; i < players.length; i += 2) {
            if (i + 1 < players.length) {
                matches.push({ p1: players[i], p2: players[i + 1] });
            }
            else {
                matches.push({ p1: players[i], p2: "— (qualifié d'office)" });
            }
        }
        localStorage.setItem("tournamentMatches", JSON.stringify(matches));
        localStorage.setItem("currentTournamentMatch", "0");
        navigate(`/game?mode=tournament&player1=${encodeURIComponent(matches[0].p1)}&player2=${encodeURIComponent(matches[0].p2)}`);
    });
}
