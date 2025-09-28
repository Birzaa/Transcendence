export function renderTournamentWinner(winner) {
    const app = document.getElementById("app");
    if (!app)
        return;
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center flex flex-col items-center justify-center">
      <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
        <!-- Barre violette -->
        <div class="bg-purple-600 text-pink-100 p-3">
          <h1 class="text-xl font-bold text-center">🏆 Champion du Tournoi 🏆</h1>
        </div>
        <!-- Contenu -->
        <div class="p-6 text-center">
          <img src="/images/winner.png" alt="Winner" class="mx-auto mb-6 w-32 h-32 animate-bounce" />
          <p class="pixel-font text-xl text-purple-700 mb-8">${winner} gagne le tournoi 🎉</p>
          <button id="back-menu"
            class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                   text-purple-800 font-bold
                   shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                   active:shadow-none active:translate-y-[2px] active:border-purple-300
                   transition-all duration-100">
            ← Retour au menu
          </button>
        </div>
      </div>
    </div>
  `;
    document.getElementById("back-menu")?.addEventListener("click", () => {
        localStorage.removeItem("tournamentMatches");
        localStorage.removeItem("currentTournamentMatch");
        window.location.assign("/");
    });
}
