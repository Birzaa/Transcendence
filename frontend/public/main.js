import { renderHome } from "./views/home.js";
import { renderProfil } from "./views/profil.js";
import { renderChat } from "./views/chat.js";
import { renderAuth } from "./views/auth.js";
import { navBar } from "./components/navbar.js";
import { renderSettings } from "./views/settings.js";
import { renderSoloGame } from "./views/solo.js";
import { render1vs1 } from "./views/1vs1.js";
async function renderNav() {
    const existingNav = document.querySelector('nav');
    if (existingNav)
        existingNav.remove();
    const nav = await navBar();
    document.body.prepend(nav);
}
function render(pathWithQuery) {
    const url = new URL(window.location.origin + pathWithQuery);
    const basePath = url.pathname;
    const params = url.searchParams;
    switch (basePath) {
        case '/':
            renderHome();
            break;
        case '/chat':
            renderChat();
            break;
        case '/auth':
            renderAuth();
            break;
        case '/settings':
            renderSettings();
            break;
        case '/profil':
            {
                const player = params.get('player');
                if (player)
                    renderProfil(player);
                else
                    renderProfil();
                break;
            }
        // Modifie le switch case pour ajouter le mode 1vs1 :
        case '/game': {
            const mode = url.searchParams.get('mode');
            if (mode === 'solo') {
                renderSoloGame();
            }
            else if (mode === '1v1') { // Nouveau cas pour le 1vs1
                render1vs1();
            }
            else {
                document.getElementById("app").innerHTML = `<h1 class="text-center mt-10">Mode "${mode}" non supporté.</h1>`;
            }
            break;
        }
        default:
            document.getElementById("app").innerHTML = `<h1 class="text-center text-5xl p-10">Page non trouvée</h1>`;
        // Dans le switch case de votre main.ts, ajoutez :
        case '/game': {
            const mode = url.searchParams.get('mode');
            if (mode === 'solo') {
                renderSoloGame(); // Ajoutez cette importation en haut du fichier
            }
            // Ajoutez ici les autres modes (multiplayer, tournament) plus tard
            break;
        }
    }
}
// Exposez les fonctions pour qu'elles soient accessibles depuis le HTML
//(window as any).handleSoloGame = handleSoloGame;
window.navigate = navigate;
// Navigation SPA
export function navigate(pathWithQuery) {
    window.history.pushState({}, '', pathWithQuery);
    render(pathWithQuery);
}
// Intercepter les clics <a>
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.tagName === 'A') {
        const anchor = target;
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('/')) {
            e.preventDefault();
            navigate(href);
        }
    }
});
window.addEventListener('popstate', () => {
    render(window.location.pathname + window.location.search);
});
// Initialisation
async function init() {
    await renderNav();
    render(window.location.pathname + window.location.search);
}
init();
