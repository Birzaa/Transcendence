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
import { renderTournament } from "./views/tournament.js";

async function renderNav() {
  const existingNav = document.querySelector("nav");
  if (existingNav) existingNav.remove();

  const nav = await navBar();
  document.body.prepend(nav);
}

function render(pathWithQuery: string): void {
  const url = new URL(window.location.origin + pathWithQuery);
  const basePath = url.pathname;
  const params = url.searchParams;

  switch (basePath) {
    case "/":
      renderHome();
      break;

    case "/chat":
      renderChat();
      break;

    case "/auth":
      renderAuth();
      break;

    case "/settings":
      renderSettings();
      break;

    case "/profil": {
      const player = params.get("player");
      if (player) renderProfil(player);
      else renderProfil();
      break;
    }

    case "/game": {
      const mode = url.searchParams.get("mode");
    
      if (mode === "solo") {
        renderSoloGame();
      } else if (mode === "1v1") {
        render1vs1();
      } else if (mode === "remote") {
        const roomId = params.get("roomId");
    
        if (roomId) {
          // (si ton serveur WS écoute sur /ws, utilise "ws://localhost:3000/ws")
          const ws = new WebSocket("ws://localhost:3000");
          renderRemoteGame(ws, "guest", roomId);
        } else {
          renderRemoteRoom();
        }
      } else if (mode === "tournament") {
        renderTournament();                 // ⬅️ new
      } else {
        document.getElementById("app")!.innerHTML =
          `<h1 class="text-center mt-10">Mode "${mode}" non supporté.</h1>`;
      }
      break;
    }    

    default:
      document.getElementById("app")!.innerHTML =
        `<h1 class="text-center text-5xl p-10">Page non trouvée</h1>`;
  }
}

// Navigation SPA
(window as any).navigate = navigate;

export function navigate(pathWithQuery: string): void {
  window.history.pushState({}, "", pathWithQuery);
  render(pathWithQuery);
}

// Intercepter les clics <a>
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "A") {
    const anchor = target as HTMLAnchorElement;
    const href = anchor.getAttribute("href");
    if (href && href.startsWith("/")) {
      e.preventDefault();
      navigate(href);
    }
  }
});

window.addEventListener("popstate", () => {
  render(window.location.pathname + window.location.search);
});

// Initialisation
async function init() {
  await renderNav();
  render(window.location.pathname + window.location.search);
}
init();
