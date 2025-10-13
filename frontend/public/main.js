import { renderHome } from "./views/home.js";
import { renderProfil, initProfilSubscriptions } from "./views/profil.js";
import { renderChat } from "./views/chat.js";
import { renderAuth } from "./views/auth.js";
import { setupNavBar } from "./components/navbar.js";
import { renderSettings } from "./views/settings.js";
import { renderPerformances } from "./views/performance.js";
import { renderGameMenu } from "./views/gamemenu.js";
import { renderRemoteRoom } from "./views/remoteRoom.js";
import { renderRemoteGame } from "./views/remoteGame.js";
import { renderTournament } from "./views/tournament.js";
import { setLanguage, getLanguage, updateUI, initI18n } from "./utils/i18n.js";
import { renderGameSettings } from "./views/gamesettings.js";
let statusListeners = [];
let onlineUsers = [];
export function getOnlineUsers() {
    return onlineUsers;
}
export function subscribeToStatusUpdates(cb) {
    if (!statusListeners.includes(cb))
        statusListeners.push(cb);
    return () => {
        statusListeners = statusListeners.filter((listener) => listener !== cb);
    };
}
class UserState {
    constructor() {
        this._currentUsername = "anonymous";
    }
    get currentUsername() { return this._currentUsername; }
    set currentUsername(username) {
        if (this._currentUsername !== username) {
            this._currentUsername = username;
            window.dispatchEvent(new CustomEvent("userStateChanged", { detail: { username } }));
        }
    }
}
export const userState = new UserState();
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let isUsernameSent = false;
let hasLoggedConnection = false;
let isConnecting = false;
export async function connectWebSocket(_username) {
    if (isConnecting)
        return;
    if (socket && socket.readyState === WebSocket.OPEN)
        return;
    isConnecting = true;
    if (socket) {
        socket.close();
        socket = null;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;
    try {
        socket = new WebSocket(wsUrl);
        socket.addEventListener("open", () => {
            isConnecting = false;
            reconnectAttempts = 0;
            isUsernameSent = false;
            sendUsernameWhenReady(userState.currentUsername, false);
            if (!hasLoggedConnection)
                hasLoggedConnection = true;
        });
        socket.addEventListener("message", (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === "status_update" || msg.type === "online_users" || msg.type === "user_list" ||
                    msg.type === "message" || msg.type === "private_message" ||
                    msg.type === "game_invite" || msg.type === "room_created_for_game") {
                    if (msg.type === "user_list" || msg.type === "online_users") {
                        if (msg.users)
                            onlineUsers = msg.users;
                    }
                    statusListeners.forEach(cb => cb(msg));
                }
            }
            catch { }
        });
        socket.addEventListener("close", () => {
            isConnecting = false;
            onlineUsers = onlineUsers.filter(user => user !== userState.currentUsername);
            statusListeners.forEach(cb => cb({ type: "user_list", users: onlineUsers }));
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && userState.currentUsername !== "anonymous") {
                const delay = Math.min(5000, 1000 * Math.pow(2, reconnectAttempts));
                setTimeout(() => connectWebSocket(userState.currentUsername), delay);
                reconnectAttempts++;
            }
        });
        socket.addEventListener("error", (error) => {
            isConnecting = false;
            console.error("Erreur WebSocket:", error);
        });
    }
    catch (error) {
        isConnecting = false;
        console.error("Erreur lors de la création du WebSocket:", error);
    }
}
function sendUsernameWhenReady(username, inChat = false) {
    if (!socket || isUsernameSent)
        return;
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "set_username", username, inChat }));
        isUsernameSent = true;
    }
    else {
        setTimeout(() => sendUsernameWhenReady(username, inChat), 200);
    }
}
export function joinChat() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "set_username", username: userState.currentUsername, inChat: true }));
    }
}
export function leaveChat() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "set_username", username: userState.currentUsername, inChat: false }));
    }
}
// --- Navigation SPA ---
async function renderNav() {
    const existingNav = document.querySelector("nav");
    if (existingNav)
        existingNav.remove();
    await setupNavBar();
    // Attacher le listener du sélecteur de langue
    const select = document.getElementById("language-select");
    if (select) {
        select.value = getLanguage();
        select.addEventListener("change", async (e) => {
            const target = e.target;
            await setLanguage(target.value);
        });
    }
}
function render(pathWithQuery) {
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
        case "/performances":
            renderPerformances();
            break;
        case "/profil": {
            const player = params.get("player");
            renderProfil(player ?? undefined);
            initProfilSubscriptions();
            break;
        }
        case "/tournament":
            renderTournament();
            break;
        case "/game": {
            const mode = params.get("mode");
            if (!mode)
                renderGameMenu();
            else if (mode === "solo" || mode === "1v1" || mode === "tournament")
                renderGameSettings();
            else if (mode === "remote") {
                const roomId = params.get("roomId");
                const role = params.get('role');
                if (roomId) {
                    if (socket)
                        renderRemoteGame(socket, role, roomId);
                    else
                        renderRemoteRoom();
                }
                else
                    renderRemoteRoom();
            }
            else
                document.getElementById("app").innerHTML = `<h1 class="text-center mt-10">Mode "${mode}" non supporté.</h1>`;
            break;
        }
        default:
            document.getElementById("app").innerHTML = `<h1 class="text-center text-5xl p-10">Page non trouvée</h1>`;
    }
    // Mettre à jour les textes traduisibles
    updateUI();
}
export function navigate(pathWithQuery) {
    const currentPath = window.location.pathname;
    const currentParams = new URLSearchParams(window.location.search);
    if (currentPath === "/game" && currentParams.get("mode") === "remote") {
        const cleanup = window.__remoteGameCleanup;
        if (cleanup && typeof cleanup === 'function') {
            cleanup();
            window.__remoteGameCleanup = null;
        }
    }
    if (currentPath === "/chat")
        leaveChat();
    window.history.pushState({}, "", pathWithQuery);
    render(pathWithQuery);
    if (pathWithQuery.startsWith("/chat"))
        joinChat();
}
window.addEventListener("popstate", () => {
    const cleanup = window.__remoteGameCleanup;
    if (cleanup && typeof cleanup === 'function') {
        const newUrl = new URL(window.location.href);
        const isStillInRemoteGame = newUrl.pathname === "/game" && newUrl.searchParams.get("mode") === "remote";
        if (!isStillInRemoteGame) {
            cleanup();
            window.__remoteGameCleanup = null;
        }
    }
    render(window.location.pathname + window.location.search);
});
window.addEventListener("userStateChanged", async (e) => {
    const detail = e.detail;
    await renderNav();
    if (socket) {
        socket.close();
        socket = null;
        isUsernameSent = false;
    }
    if (detail.username !== "anonymous")
        await connectWebSocket(detail.username);
});
async function initializeApp() {
    console.log("===== init called =================");
    // Initialisation i18n
    await initI18n();
    // Récupération de l'utilisateur connecté
    try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.ok) {
            const user = await res.json();
            userState.currentUsername = user.name || "anonymous";
        }
        else
            userState.currentUsername = "anonymous";
    }
    catch {
        userState.currentUsername = "anonymous";
    }
    // Rendu de la navbar
    await renderNav();
    // Rendu de la page actuelle
    render(window.location.pathname + window.location.search);
    // Connexion WebSocket si utilisateur connecté
    if (userState.currentUsername !== "anonymous") {
        await connectWebSocket(userState.currentUsername);
    }
}
// Gestion fermeture onglet
window.addEventListener("beforeunload", () => {
    if (socket) {
        if (socket.readyState === WebSocket.OPEN) {
            try {
                socket.send(JSON.stringify({ type: "user_disconnected", username: userState.currentUsername }));
            }
            catch (e) {
                console.log("Impossible d'envoyer le message de déconnexion");
            }
        }
        socket.close();
        socket = null;
    }
});
// Initialisation unique
if (!window._appInitialized) {
    window._appInitialized = true;
    initializeApp();
}
// Intercepter les clics sur les liens
document.addEventListener("click", (e) => {
    const target = e.target;
    if (target.tagName === "A") {
        const href = target.getAttribute("href");
        if (href?.startsWith("/")) {
            e.preventDefault();
            navigate(href);
        }
    }
});
// Debug et exposition globale
window.debugSocket = {
    getUsername: () => userState.currentUsername,
    getSocketStatus: () => socket?.readyState,
    getSocket: () => socket,
    reconnect: () => connectWebSocket(userState.currentUsername),
};
window.navigate = navigate;
