export function renderGameMenu(onModeSelected) {
    const menu = document.createElement('div');
    menu.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    menu.innerHTML = `
        <div class="bg-yellow-50 p-6 rounded-lg shadow-xl border-2 border-purple-400">
            <h3 class="text-xl font-bold text-purple-800 mb-4">Choisis un mode :</h3>
            <button class="game-mode-btn" data-mode="solo">🎮 Solo</button>
            <button class="game-mode-btn" data-mode="multiplayer">👥 Multijoueur</button>
            <button class="game-mode-btn" data-mode="tournament">🏆 Tournoi</button>
        </div>
    `;
    // Gestion des clics sur les boutons
    menu.querySelectorAll('.game-mode-btn').forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.getAttribute('data-mode');
            onModeSelected(mode);
            menu.remove(); // Ferme le menu après sélection
        });
    });
    return menu;
}
