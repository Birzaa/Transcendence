import { renderHome } from "./views/home.js";
import { renderProfil } from "./views/profil.js";
import { renderChat } from "./views/chat.js";
import { renderAuth } from "./views/auth.js";
import { navBar } from "./components/navbar.js";
import { renderSettings } from "./views/settings.js";
import { renderPerformances } from "./views/performance.js"


async function renderNav() {
  const existingNav = document.querySelector('nav');
  if (existingNav) existingNav.remove();

  const nav = await navBar();
  document.body.prepend(nav);
}

async function init() {
  await renderNav(); // initial load
  render(window.location.pathname + window.location.search);
}
init();

const socket = new WebSocket(`ws://${window.location.hostname}:3001/ws`);
socket.onopen = () => {
  console.log('✅ Connecté au WebSocket');
  socket.send('ping');
};

socket.onmessage = (event) => {
  console.log('📨 Message du serveur :', event.data);
};

socket.onclose = () => {
  console.log('❌ Déconnecté du WebSocket');
};


// Différentes pages
function render(pathWithQuery: string): void {
  const url = new URL(window.location.origin + pathWithQuery);
  const basePath = url.pathname;
  const params = url.searchParams;
  
  switch (basePath) {
    case '/': renderHome(); break;
    case '/chat': renderChat(); break;
    case '/auth': renderAuth(); break;
    case '/settings': renderSettings(); break;
    case '/performances': renderPerformances(); break;

    case '/profil':
      {
        const player = params.get('player');
        if (player)
          renderProfil(player);
        else
          renderProfil();
        break;
      }

    default:
      document.getElementById("app")!.innerHTML = `<h1 class="text-center text-5xl p-10">Page non trouvée</h1>`;
  }
}

// Intercepter les clics sur les liens
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A')
  {
    const anchor = target as HTMLAnchorElement;
    const href = anchor.getAttribute('href');
    if (href && href.startsWith('/')) {
      e.preventDefault(); // stop le rechargement
      navigate(href);     // navigation SPA
    }
  }
})

// SPA
export function navigate(pathWithQuery: string): void {
  window.history.pushState({}, '', pathWithQuery);
  render(pathWithQuery);
}

// Gérer les retours en arrière du navigateur
window.addEventListener('popstate', () => {
  render(window.location.pathname + window.location.search);
});
