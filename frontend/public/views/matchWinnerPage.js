import { navigate } from "../main";
export function renderMatchWinnerPage(winner, nextMatch) {
    const app = document.getElementById("app");
    if (!app)
        return;
    app.innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center bg-[url('/images/background.png')] bg-cover bg-fixed">
        <div class="bg-pink-50 bg-opacity-90 p-8 rounded-lg shadow-lg text-center border-2 border-purple-300">
          <img src="/images/winner.png" alt="Winner" class="mx-auto mb-4 w-32 h-32 animate-bounce" />
          <h2 class="text-2xl font-bold text-yellow-400 pixel-font mb-6">${winner} gagne 🎉</h2>
  
          ${nextMatch
        ? `<button id="next-match" class="px-6 py-2 bg-purple-300 text-purple-800 font-bold border-2 border-purple-500">
                   Partie suivante
                 </button>`
        : `<p class="text-lg text-purple-600">Tournoi terminé 🎊</p>`}
        </div>
      </div>
    `;
    if (nextMatch) {
        document.getElementById("next-match")?.addEventListener("click", () => {
            navigate(`/game?mode=tournament&player1=${encodeURIComponent(nextMatch.p1)}&player2=${encodeURIComponent(nextMatch.p2)}`);
        });
    }
}
