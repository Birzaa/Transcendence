import { renderHome } from "./views/home.js";
import { renderProfil } from "./views/profil.js";
import { renderChat } from "./views/chat.js";
import { renderAuth } from "./views/auth.js";
import { navBar } from "./components/navbar.js";

// Barre de navigation
const body = document.body;
body.prepend(navBar());

// Différentes pages
function render(path: string): void {
  switch (path) {
    case '/': renderHome(); break;
    case '/profil': renderProfil(); break;
    case '/chat': renderChat(); break;
    case '/auth': renderAuth(); break;
    default:
      document.getElementById("app")!.innerHTML = `<h1>Page non trouvée</h1>`;
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
function navigate(path: string): void {
  window.history.pushState({}, '', path);
  render(path);
}

// Gérer les retours en arrière du navigateur
window.addEventListener('popstate', () => {
  render(window.location.pathname);
});

// Initialisation
render(window.location.pathname);
