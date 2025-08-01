import { renderSoloGame } from "./solo";
import { navigate } from "../main";

export function renderGameMenu(): string {
    return `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
            <!-- Barre violette avec titre et croix style bouton -->
            <div class="bg-purple-600 text-pink-100 p-3 flex justify-between items-center">
                <h1 class="text-xl font-bold ml-2">Choisir un mode de jeu</h1>
                <button onclick="document.getElementById('game-menu-container')?.remove()"
                    class="relative w-8 h-8 flex items-center justify-center 
                           bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                           text-purple-800 font-bold
                           shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                           hover:bg-purple-300
                           active:shadow-none active:translate-y-[2px] active:border-purple-300
                           transition-all duration-100">
                    ×
                </button>
            </div>

            <!-- Tous les modes de jeu -->
            <div class="p-6 space-y-6">
                <div class="space-y-4">
                    <!-- Nouveau mode 1 vs 1 -->
                    <button onclick="window.navigate('/game?mode=1v1')"
                        class="w-full flex items-center px-6 py-3 bg-purple-200 
                               border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                               text-purple-800 font-bold
                               shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                               active:shadow-none active:translate-y-[2px] active:border-purple-300
                               transition-all duration-100">
                        <span class="text-purple-300 mx-1 text-lg">☆</span>
                        <span>1 vs 1</span>
                        <span class="ml-auto text-xl">⚔️</span>
                    </button>

                    <!-- Mode Solo -->
                    <button onclick="window.navigate('/game?mode=solo')"
                        class="w-full flex items-center px-6 py-3 bg-purple-200 
                               border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                               text-purple-800 font-bold
                               shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                               active:shadow-none active:translate-y-[2px] active:border-purple-300
                               transition-all duration-100">
                        <span class="text-purple-300 mx-1 text-lg">☆</span>
                        <span>Mode Solo</span>
                        <span class="ml-auto text-xl">🎮</span>
                    </button>

                    <!-- Multijoueur -->
                    <button onclick="window.navigate('/game?mode=multiplayer')"
                        class="w-full flex items-center px-6 py-3 bg-purple-200 
                               border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                               text-purple-800 font-bold
                               shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                               active:shadow-none active:translate-y-[2px] active:border-purple-300
                               transition-all duration-100">
                        <span class="text-purple-300 mx-1 text-lg">☆</span>
                        <span>Multijoueur</span>
                        <span class="ml-auto text-xl">👥</span>
                    </button>

                    <!-- Tournoi -->
                    <button onclick="window.navigate('/game?mode=tournament')"
                        class="w-full flex items-center px-6 py-3 bg-purple-200 
                               border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                               text-purple-800 font-bold
                               shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                               active:shadow-none active:translate-y-[2px] active:border-purple-300
                               transition-all duration-100">
                        <span class="text-purple-300 mx-1 text-lg">☆</span>
                        <span>Tournoi</span>
                        <span class="ml-auto text-xl">🏆</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}