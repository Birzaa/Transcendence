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
  if (!statusListeners.includes(cb)) {
    statusListeners.push(cb);
  }
}

function sendUsernameWhenReady(username: string) {
  if (!socket) {
    console.warn("WebSocket non initialisé");
    return;
  }

  if (isUsernameSent) return;

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'set_username',
      username,
      timestamp: Date.now(),
    }));
    console.log('Username envoyé:', username);
    isUsernameSent = true;
  } else {
    // Retente dans 200ms si socket pas encore ouvert
    setTimeout(() => sendUsernameWhenReady(username), 200);
  }
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
let hasLoggedConnection = false;
let isConnecting = false; // Nouveau flag pour éviter les connexions multiples

export async function connectWebSocket(username: string) {
  // Éviter les connexions multiples
  if (isConnecting) {
    console.log('Connexion WebSocket déjà en cours...');
    return;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket déjà connecté');
    return;
  }

  isConnecting = true;

  // Fermer proprement la connexion existante
  if (socket) {
    socket.close();
    socket = null;
  }

  await new Promise(resolve => setTimeout(resolve, 100)); // Réduit le délai

  // Utiliser le bon protocole (ws ou wss) selon la page
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

  console.log('Tentative de connexion WebSocket à:', wsUrl);
  
  try {
    socket = new WebSocket(wsUrl);

    socket.addEventListener('open', () => {
      isConnecting = false;
      if (!hasLoggedConnection) {
        console.log('✅ Connecté au WebSocket');
        hasLoggedConnection = true;
      } 
      reconnectAttempts = 0;
      isUsernameSent = false;

      sendUsernameWhenReady(userState.currentUsername);
    });

    socket.addEventListener('message', (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        console.log('Message WebSocket reçu:', msg);

        if (msg.type === "status_update" || msg.type === "online_users") {
          statusListeners.forEach(cb => cb(msg));
        } else if (msg.type === "user_list") {
          onlineUsers = msg.users;
          statusListeners.forEach(cb => cb(msg));
        } else if (msg.type === "message" || msg.type === "private_message") {
          // Transmettre les messages de chat aux listeners
          statusListeners.forEach(cb => cb(msg));
        }
      } catch (err) {
        console.warn("Message WebSocket invalide :", event.data);
      }
    });

    socket.addEventListener('close', () => {
      isConnecting = false;
      console.log('❌ Déconnecté du WebSocket');
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && userState.currentUsername !== 'anonymous') {
        const delay = Math.min(5000, 1000 * Math.pow(2, reconnectAttempts));
        console.log(`Tentative de reconnexion dans ${delay}ms...`);
        setTimeout(() => connectWebSocket(userState.currentUsername), delay);
        reconnectAttempts++;
      }
    });

    socket.addEventListener('error', (error) => {
      isConnecting = false;
      console.error('Erreur WebSocket:', error);
    });

  } catch (error) {
    isConnecting = false;
    console.error('Erreur lors de la création du WebSocket:', error);
  }
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
    isUsernameSent = false;
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

// Événement beforeunload pour nettoyer
window.addEventListener('beforeunload', () => {
  if (socket) {
    socket.close();
    socket = null;
  }
});

// Éviter l'initialisation multiple
if (!window._appInitialized) {
  window._appInitialized = true;
  initializeApp();
} else {
  console.log('App déjà initialisée');
}

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
  getSocket: () => socket,
  reconnect: () => connectWebSocket(userState.currentUsername)
};

// A corriger intégrer directement la fonction navigate() dans home.ts pour l'utiliser
(window as any).navigate = navigate;

// Déclaration pour TypeScript
declare global {
  interface Window {
    _appInitialized?: boolean;
  }
}