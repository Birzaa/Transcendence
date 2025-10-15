import { renderGameMenu } from "./gamemenu.js";
import { navigate } from "../main.js";
import { updateUI } from "../utils/i18n.js";
export function renderHome() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
      <div class="min-h-screen flex flex-col items-center justify-center space-y-8">

        <!-- Chats flottants -->
        <img src="/images/logo.png" class="fixed left-4 top-1/2 transform -translate-y-1/2 w-24 h-24 animate-float" alt="Chat kawaii">
        <img src="/images/logo.png" class="fixed right-4 top-1/2 transform -translate-y-1/2 w-24 h-24 animate-float" alt="Chat kawaii">

        <!-- Section Jeu -->
        <div class="max-w-md w-full bg-yellow-50 bg-opacity-90 p-6 border-2 border-dark-yellow shadow-lg relative">
          <img src="/images/logo.png" class="absolute -top-4 -right-4 w-12 h-12 rotate-12" alt="Petit chat">
          <h2 class="text-xl font-bold text-purple-800 mb-4 flex justify-center items-center">
            <span class="text-purple-300 mr-2">☆</span> <span data-i18n="JouerauPong">Jouer au Pong</span>
          </h2>
          <button id="play-button"
            class="relative px-8 py-3 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
              text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
              active:shadow-none active:translate-y-[2px] active:border-purple-300
              transition-all duration-100 w-full"
            data-i18n="play_pong">
            Lancer une partie
          </button>
        </div>

        <!-- Chat & Classement -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
          <div class="bg-baby-pink bg-opacity-90 p-6 border-2 border-baby-pink-dark shadow-lg relative">
            <img src="/images/logo.png" class="absolute -bottom-4 -left-4 w-12 h-12 -rotate-12" alt="Petit chat">
            <h3 class="font-bold text-purple-800 mb-4 flex justify-center items-center">
              <span class="text-baby-pink-dark mr-2">☆</span> <span data-i18n="live_chat">Chat en direct</span>
            </h3>
            <button id="chat-button"
              class="relative px-6 py-2 bg-baby-pink border-2 border-t-white border-l-white border-r-baby-pink-dark border-b-baby-pink-dark
                text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                active:shadow-none active:translate-y-[2px] active:border-baby-pink-dark
                transition-all duration-100 w-full"
              data-i18n="open_btn">
              (=^･ω･^=) Ouvrir
            </button>
          </div>

          <div class="bg-baby-blue bg-opacity-90 p-6 border-2 border-darkest-blue shadow-lg relative">
            <img src="/images/logo.png" class="absolute -top-4 -left-4 w-12 h-12 -rotate-12" alt="Petit chat">
            <h3 class="font-bold text-purple-800 mb-4 flex justify-center items-center">
              <span class="text-darkest-blue mr-2">☆</span> <span data-i18n="Home_Performances">Performances</span>
            </h3>
            <button id="leaderboard-button"
              class="relative px-6 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                active:shadow-none active:translate-y-[2px] active:border-purple-300
                transition-all duration-100 w-full"
              data-i18n="Home_PerformancesBtn">
              ٩(◕‿◕｡)۶ Ouvrir
            </button>
          </div>
        </div>

        <style>
          @keyframes float {
            0%, 100% { transform: translateY(-10px) translateX(0); }
            50% { transform: translateY(10px) translateX(5px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        </style>
      </div>
    </div>
  `;
    document.getElementById('play-button')?.addEventListener('click', () => {
        const existingMenu = document.getElementById('game-menu-container');
        if (!existingMenu) {
            const menuContainer = document.createElement('div');
            menuContainer.id = 'game-menu-container';
            menuContainer.innerHTML = renderGameMenu();
            document.body.appendChild(menuContainer);
            updateUI(); // Applique les traductions au menu nouvellement créé
        }
    });
    document.getElementById('chat-button')?.addEventListener('click', () => {
        navigate('/chat');
    });
    document.getElementById('leaderboard-button')?.addEventListener('click', () => {
        navigate('/performances');
    });
}
