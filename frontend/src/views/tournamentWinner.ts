import { navigate } from "../main.js";

export function renderTournamentWinner(winner: string): void {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center flex flex-col items-center justify-center">
      <div class="bg-pink-50 bg-opacity-90 shadow-lg border-4 border-purple-400 px-8 py-12 text-center max-w-lg">
        <img src="/images/winner.png" alt="Winner" class="mx-auto mb-6 w-40 h-40 animate-bounce" />
        <h1 class="pixel-font text-3xl font-bold text-yellow-400 mb-4">🏆 Champion du Tournoi 🏆</h1>
        <p class="pixel-font text-xl text-purple-700 mb-8">${winner} gagne le tournoi 🎉</p>
        <button id="back-menu"
          class="px-6 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
          text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
          active:shadow-none active:translate-y-[2px] active:border-purple-300 transition-all duration-100">
          Retour au menu
        </button>
      </div>
    </div>
  `;

  document.getElementById("back-menu")?.addEventListener("click", () => {
    localStorage.removeItem("tournamentMatches");
    localStorage.removeItem("currentTournamentMatch");
    navigate("/");
  });
}
