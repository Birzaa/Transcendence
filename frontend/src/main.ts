import { renderHome } from "./views/home.js";
import { renderProfil } from "./views/profil.js";
import { renderChat } from "./views/chat.js";
import { renderAuth } from "./views/auth.js";
import { navBar } from "./components/navbar.js";
import { renderSettings } from "./views/settings.js";
import { renderGameMenu } from "./views/gamemenu.js";
import { renderSoloGame } from "./views/solo.js";
import { render1vs1 } from "./views/1vs1.js";
import { renderRemoteRoom } from "./views/remoteRoom.js";
import { renderRemoteGame } from "./views/remoteGame.js";
import { t, setLanguage, getLanguage, updateUI, initI18n } from "./utils/i18n.js";

(async () => {
  await initI18n(); // Chargement des traductions au démarrage
})();

async function renderNav() {
  const existingNav = document.querySelector('nav');
  if (existingNav) existingNav.remove();

  const nav = await navBar();
  document.body.prepend(nav);

  // ATTACHER LE LISTENER ICI, après que le navbar soit dans le DOM
  const select = document.getElementById("language-select") as HTMLSelectElement;
  if (select) {
    select.value = getLanguage(); // Définit la valeur du select sur la langue courante
    select.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      setLanguage(target.value);
    });
  }
}

function render(pathWithQuery: string): void {
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
    case '/profil': {
      const player = params.get('player');
      if (player) renderProfil(player);
      else renderProfil();
      break;
    }
    case '/game': {
      const mode = params.get('mode');
      if (mode === 'solo') {
        renderSoloGame();
      } else if (mode === '1v1') {
        render1vs1();
      } else if (mode === 'remote') {
        if (params.has('roomId')) {
          renderRemoteGame();
        } else {
          renderRemoteRoom();
        }
      } else {
        document.getElementById("app")!.innerHTML = `<h1 class="text-center mt-10">Mode "${mode}" non supporté.</h1>`;
      }
      break;
    }
    default:
      document.getElementById("app")!.innerHTML = `<h1 class="text-center text-5xl p-10">Page non trouvée</h1>`;
  }

  // Mettre à jour les textes avec la langue courante après chaque rendu
  updateUI();
}

// Expose functions globally
(window as any).navigate = navigate;

// Navigation SPA
export function navigate(pathWithQuery: string): void {
  window.history.pushState({}, '', pathWithQuery);
  render(pathWithQuery);
}

// Intercepter les clics <a>
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A') {
    const anchor = target as HTMLAnchorElement;
    const href = anchor.getAttribute('href');
    if (href && href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    }
  }
});

// Gestion du bouton "retour" du navigateur
window.addEventListener('popstate', () => {
  render(window.location.pathname + window.location.search);
});

// Initialisation
async function init() {
  console.log("===== init called ================= ");
  await initI18n();       // Chargement des traductions
  await renderNav();       // Navbar + listener
  render(window.location.pathname + window.location.search); // Rendu de la page actuelle
}
init();
