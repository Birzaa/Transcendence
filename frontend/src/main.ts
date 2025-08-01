import { renderHome } from "./views/home.js";
import { renderProfil, initProfilSubscriptions } from "./views/profil.js";
import { renderChat } from "./views/chat.js";
import { renderAuth } from "./views/auth.js";
import { navBar, setupNavBar } from "./components/navbar.js";
import { renderSettings } from "./views/settings.js";
import { renderPerformances } from "./views/performance.js";
import { renderGameMenu } from "./views/gamemenu.js";
import { renderSoloGame } from "./views/solo.js";
import { render1vs1 } from "./views/1vs1.js";

type WSMessage = {
  type: string;
  [key: string]: any;
};

const statusListeners: ((msg: WSMessage) => void)[] = [];
let onlineUsers: string[] = [];

export function getOnlineUsers() {
  return onlineUsers;
}

export function subscribeToStatusUpdates(cb: (msg: WSMessage) => void) {
  statusListeners.push(cb);
}

// Gestion du userState avec setter déclenchant un événement custom
class UserState {
  private _currentUsername = 'anonymous';

  get currentUsername() {
    return this._currentUsername;
  }

  set currentUsername(username: string) {
    if (this._currentUsername !== username) {
      this._currentUsername = username;
      // Dispatch event global pour signaler le changement
      window.dispatchEvent(new CustomEvent('userStateChanged', { detail: { username } }));
    }
  }
}
export const userState = new UserState();

let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let isUsernameSent = false;

export async function connectWebSocket(username: string) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket déjà connecté');
    return;
  }

  socket = new WebSocket(`ws://${window.location.hostname}:3001/ws`);

  socket.addEventListener('open', () => {
    console.log('✅ Connecté au WebSocket');
    reconnectAttempts = 0;
    isUsernameSent = false;

    if (socket && socket.readyState === WebSocket.OPEN && !isUsernameSent) {
      socket.send(JSON.stringify({
        type: 'set_username',
        username: username,
        timestamp: Date.now()
      }));
      isUsernameSent = true;
      console.log('Username envoyé:', username);
    }
  });

  socket.addEventListener('message', (event) => {
    try {
      const msg: WSMessage = JSON.parse(event.data);

      if (msg.type === "status_update" || msg.type === "online_users") {
        statusListeners.forEach(cb => cb(msg));
      } else if (msg.type === "user_list") {
        onlineUsers = msg.users;
        statusListeners.forEach(cb => cb(msg));
      }
    } catch (err) {
      console.warn("Message WebSocket invalide :", event.data);
    }
  });

  socket.addEventListener('close', () => {
    console.log('❌ Déconnecté du WebSocket');
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(5000, 1000 * Math.pow(2, reconnectAttempts));
      console.log(`Tentative de reconnexion dans ${delay}ms...`);
      setTimeout(() => connectWebSocket(userState.currentUsername), delay);
      reconnectAttempts++;
    }
  });

  socket.addEventListener('error', (error) => {
    console.error('Erreur WebSocket:', error);
  });
}

// Navigation SPA

async function renderNav() {
  await setupNavBar();
}

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
    case '/profil': {
      const player = params.get('player');
      renderProfil(player ?? undefined);
      initProfilSubscriptions();
      break;
    }
    case '/game': {
      const mode = params.get('mode');
      if (mode === 'solo') renderSoloGame();
      else if (mode === '1v1') render1vs1();
      else document.getElementById("app")!.innerHTML =
        `<h1 class="text-center mt-10">Mode "${mode}" non supporté.</h1>`;
      break;
    }
    default:
      document.getElementById("app")!.innerHTML =
        `<h1 class="text-center text-5xl p-10">Page non trouvée</h1>`;
  }
}

export function navigate(pathWithQuery: string): void {
  window.history.pushState({}, '', pathWithQuery);
  render(pathWithQuery);
}

window.addEventListener('popstate', () => {
  render(window.location.pathname + window.location.search);
});

// Au changement du userState, mettre à jour navbar et websocket
window.addEventListener('userStateChanged', async (e: Event) => {
  const detail = (e as CustomEvent).detail;
  console.log('userStateChanged:', detail.username);

  // Met à jour la navbar
  await renderNav();

  // Fermer WS si ouvert
  if (socket) {
    socket.close();
    socket = null;
  }

  // Si connecté, reconnecte WS avec le nouveau user
  if (detail.username !== 'anonymous') {
    await connectWebSocket(detail.username);
  }
});

// Initialisation de l'app
async function initializeApp() {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.ok) {
      const user = await res.json();
      userState.currentUsername = user.name || 'anonymous';
    } else {
      userState.currentUsername = 'anonymous';
    }
  } catch {
    userState.currentUsername = 'anonymous';
  }

  await renderNav();
  render(window.location.pathname + window.location.search);

  if (userState.currentUsername !== 'anonymous') {
    await connectWebSocket(userState.currentUsername);
  }
}

initializeApp();

// Gestion des clics sur liens internes
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A') {
    const anchor = target as HTMLAnchorElement;
    const href = anchor.getAttribute('href');
    if (href?.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    }
  }
});

// Debug
(window as any).debugSocket = {
  getUsername: () => userState.currentUsername,
  getSocketStatus: () => socket?.readyState,
  reconnect: () => connectWebSocket(userState.currentUsername)
};
