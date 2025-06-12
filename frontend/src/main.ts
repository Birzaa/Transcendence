import { renderHome } from "./views/home.js";
import { renderProfil } from "./views/profil.js";
import { renderChat } from "./views/chat.js";
import { renderAuth } from "./views/auth.js";


function render(path: string): void {
  switch (path) {
    case '/': renderHome(navigate); break;
    case '/profil': renderProfil(navigate); break;
    case '/chat': renderChat(navigate); break;
    case '/auth': renderAuth(navigate); break;
    default:
      document.getElementById("app")!.innerHTML = `<h1>Page non trouvée</h1>`;
    }
}


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
