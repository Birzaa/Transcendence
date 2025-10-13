import { navigate } from "../main.js";
import { updateUI } from "../utils/i18n.js";

export function renderTournament(): void {
  const app = document.getElementById("app");
  if (!app) return;

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
        <div class="max-w-2xl w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
          <div class="bg-purple-600 text-pink-100 p-3">
            <h1 class="text-xl font-bold text-center" data-i18n="Tournament_Title">Tournoi Pong</h1>
          </div>
          <div class="p-6">
            <form id="tournament-form" class="space-y-6">
              ${[1, 2, 3, 4].map(i => `
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <label for="player${i}" class="whitespace-nowrap font-semibold text-purple-600 w-24" data-i18n="Tournament_Player">Joueur ${i}</label>
                    <span class="text-purple-300 text-lg">☆</span>
                    <input type="text" id="player${i}" name="player${i}" placeholder="Alias${i > 2 ? ' (optionnel)' : ''}" ${i <= 2 ? 'required' : ''}
                          class="flex-1 border-2 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
                  </div>
                  <div class="flex justify-center gap-2 flex-wrap pl-28">
                    ${["bleu","vert","jaune","orange","rose","rouge","violet","gris"].map(c => `
                      <label>
                        <input type="radio" name="color${i}" value="${c}" ${(i === 1 && c === "bleu") || (i === 2 && c === "rose") || (i === 3 && c === "vert") || (i === 4 && c === "jaune") ? "checked" : ""} class="hidden">
                        <img src="/images/raquette_${c}.png" class="paddle-option cursor-pointer w-6 h-20 border-2 ${(i === 1 && c === "bleu") || (i === 2 && c === "rose") || (i === 3 && c === "vert") || (i === 4 && c === "jaune") ? "border-purple-400" : "border-transparent"} rounded" />
                      </label>
                    `).join("")}
                  </div>
                </div>
              `).join("")}

              <!-- Score à atteindre -->
              <div class="flex items-center justify-center gap-3 pt-4">
                <label for="score" class="text-purple-600 font-bold text-center" data-i18n="Score">Score à atteindre</label>
                <input id="score" name="score" type="number" value="5" min="1" max="20"
                    class="px-2 py-1 relative bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                    text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                    active:shadow-none active:translate-y-[2px] active:border-purple-300 transition-all duration-100" />
              </div>

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

  // Appliquer les traductions
  updateUI();

  // Gestion visuelle des sélections de raquettes
  const updateHighlight = (playerNum: number) => {
    document.querySelectorAll<HTMLInputElement>(`input[name="color${playerNum}"]`).forEach(r => {
      const img = r.nextElementSibling as HTMLImageElement;
      if (img) img.style.borderColor = r.checked ? "#9e8bb0ff" : "transparent";
    });
  };

  [1, 2, 3, 4].forEach(i => {
    document.querySelectorAll<HTMLInputElement>(`input[name="color${i}"]`).forEach(input => {
      input.addEventListener("change", () => updateHighlight(i));
    });
  });

  const form = document.getElementById("tournament-form") as HTMLFormElement;
  const preview = document.getElementById("tournament-preview");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    // Récupérer les joueurs avec leurs couleurs
    const players: { name: string, color: string }[] = [];
    for (let i = 1; i <= 4; i++) {
      const name = String(formData.get(`player${i}`) || "").trim();
      if (name.length > 0) {
        const color = String(formData.get(`color${i}`) || (i === 1 ? "bleu" : i === 2 ? "rose" : i === 3 ? "vert" : "jaune"));
        players.push({ name, color });
      }
    }

    if (players.length < 2) {
      if (preview) {
        preview.innerHTML = `<p class="text-red-400" data-i18n="Tournament_MinPlayers">Il faut au moins 2 joueurs pour commencer un tournoi.</p>`;
      }
      return;
    }

    // Récupérer le score
    const score = String(formData.get("score") || "5");

    // Créer les matchs avec les infos complètes des joueurs
    const matches: { p1: { name: string, color: string }, p2: { name: string, color: string } | null }[] = [];
    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) {
        matches.push({ p1: players[i], p2: players[i + 1] });
      } else {
        matches.push({ p1: players[i], p2: null });
      }
    }

    // Enregistrer tous les joueurs avec leurs couleurs et le score
    const playersMap: { [name: string]: string } = {};
    players.forEach(p => playersMap[p.name] = p.color);
    localStorage.setItem("tournamentPlayers", JSON.stringify(playersMap));
    localStorage.setItem("tournamentScore", score);

    localStorage.setItem("tournamentMatches", JSON.stringify(matches));
    localStorage.setItem("currentTournamentMatch", "0");

    const match0 = matches[0];
    navigate(`/game?mode=tournament&player1=${encodeURIComponent(match0.p1.name)}&player2=${encodeURIComponent(match0.p2?.name || "— (qualifié d'office)")}&color1=${match0.p1.color}&color2=${match0.p2?.color || "gris"}&score=${score}`);
  });
}
