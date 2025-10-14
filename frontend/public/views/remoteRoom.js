import { renderRemoteGame } from "./remoteGame.js";
import { userState } from "../main.js";
import { t, updateUI } from "../utils/i18n.js";
export function renderRemoteRoom() {
    // Supprimer le menu existant
    const existingMenu = document.getElementById("game-menu-container");
    if (existingMenu)
        existingMenu.remove();
    // Construire l'URL WS
    const WS_URL = (() => {
        const u = new URL(window.location.href);
        const proto = u.protocol === "https:" ? "wss:" : "ws:";
        return `${proto}//${u.host}/ws`;
    })();
    const app = document.getElementById("app");
    if (!app)
        return;
    // Vérifier si le joueur a configuré sa raquette
    const url = new URL(window.location.href);
    const myColor = url.searchParams.get("myColor");
    // Si la couleur n'est pas configurée, afficher la page de sélection
    if (!myColor) {
        renderRemoteColorPicker();
        return;
    }
    // Sauvegarder la couleur du joueur dans localStorage
    localStorage.setItem("myRemoteColor", myColor);
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4 pt-[110px]">
      <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300 relative">
          <img src="/images/logo.png" class="absolute -top-4 -right-4 w-12 h-12 rotate-12" alt="Petit chat">
          <div class="bg-purple-600 text-pink-100 p-3">
            <h1 class="text-xl font-bold text-center" data-i18n="Remote_Title">Pong Remote (=^･ω･^=)</h1>
          </div>

          <div class="p-6 space-y-6">
            <div id="room-container" class="space-y-4">
              <h3 class="font-bold text-purple-800 flex items-center">
                <span class="text-purple-300 mr-2">☆</span> <span data-i18n="Remote_CreateGame">Créer une partie</span>
              </h3>
              <div class="flex items-center justify-center gap-3 mb-2">
                <label for="win-score" class="text-purple-600 font-bold text-center" data-i18n="Score">Score à atteindre</label>
                <input id="win-score" name="score" type="number" value="5" min="1" max="20"
                  class="px-2 py-1 relative bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                  text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                  active:shadow-none active:translate-y-[2px] active:border-purple-300 transition-all duration-100 w-20" />
              </div>
              <button id="create-room"
                data-i18n="Remote_CreateRoom"
                class="relative px-6 py-3 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                  text-purple-800 font-bold w-full shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                  active:shadow-none active:translate-y-[2px] active:border-purple-300 transition-all duration-100">
                Créer une salle
              </button>
            </div>

            <div class="space-y-4">
              <h3 class="font-bold text-purple-800 flex items-center">
                <span class="text-purple-300 mr-2">☆</span> <span data-i18n="Remote_JoinGame">Rejoindre une partie</span>
              </h3>
              <div class="flex gap-2">
                <input id="join-room-id" type="text" data-i18n="Remote_RoomCode" placeholder="Code salle"
                  class="flex-1 border-2 border-purple-300 px-3 py-2 bg-violet-100 focus:border-purple-400">
                <button id="join-room"
                  data-i18n="Remote_Join"
                  class="relative px-6 py-2 bg-baby-pink border-2 border-t-white border-l-white border-r-baby-pink-dark border-b-baby-pink-dark
                    text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                    active:shadow-none active:translate-y-[2px] active:border-baby-pink-dark transition-all duration-100">
                  Rejoindre
                </button>
              </div>
            </div>

            <div id="room-info" class="hidden space-y-4 pt-4 border-t border-purple-200">
              <h3 class="font-bold text-purple-800 flex items-center">
                <span class="text-purple-300 mr-2">☆</span> <span data-i18n="Remote_YourRoom">Votre salle</span>
              </h3>
              <div class="bg-violet-100 p-3 border-2 border-purple-300">
                <p id="room-id-display" class="text-center font-mono font-bold text-purple-700"></p>
              </div>
              <button id="copy-link"
                data-i18n="Remote_CopyLink"
                class="relative px-6 py-2 bg-baby-blue border-2 border-t-white border-l-white border-r-darkest-blue border-b-darkest-blue
                  text-purple-800 font-bold w-full shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                  active:shadow-none active:translate-y-[2px] active:border-darkest-blue transition-all duration-100">
                Copier le lien d'invitation
              </button>
              <p id="room-status" class="text-sm text-center text-purple-600" data-i18n="Remote_WaitingPlayer">
                En attente d'un autre joueur... (◕‿◕)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    // Appliquer les traductions
    updateUI();
    const createBtn = document.getElementById("create-room");
    const joinBtn = document.getElementById("join-room");
    const joinInput = document.getElementById("join-room-id");
    const roomContainer = document.getElementById("room-container");
    const roomInfo = document.getElementById("room-info");
    const roomIdDisplay = document.getElementById("room-id-display");
    const copyLinkBtn = document.getElementById("copy-link");
    const roomStatus = document.getElementById("room-status");
    let currentRoomId = "";
    let isConnecting = false;
    function showRoomInfo() {
        roomContainer.classList.add("hidden");
        roomInfo.classList.remove("hidden");
        roomIdDisplay.textContent = currentRoomId;
    }
    function getWebSocket() {
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            return window.socket;
        }
        window.socket = new WebSocket(WS_URL);
        isConnecting = true;
        window.socket.onopen = () => {
            isConnecting = false;
            if (userState.currentUsername !== "anonymous") {
                window.socket.send(JSON.stringify({
                    type: "set_username",
                    username: userState.currentUsername,
                    isGame: true,
                }));
            }
        };
        window.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            isConnecting = false;
            roomStatus.textContent = t("Remote_ConnectionError");
            roomStatus.classList.add("text-red-500");
        };
        return window.socket;
    }
    // Connexion immédiate
    const ws = getWebSocket();
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "room_created") {
            currentRoomId = msg.roomId;
            window.gameRole = "host";
            showRoomInfo();
            roomStatus.textContent = t("Remote_WaitingOpponent");
        }
        if (msg.type === "room_joined") {
            currentRoomId = msg.roomId;
            window.gameRole = "guest";
            showRoomInfo();
            roomStatus.textContent = t("Remote_ConnectedRoom");
        }
        if (msg.type === "player_joined") {
            const playerJoinedMsg = t("Remote_PlayerJoined").replace("{{username}}", msg.username);
            roomStatus.textContent = playerJoinedMsg;
        }
        if (msg.type === "game_start") {
            const u = new URL(window.location.href);
            u.searchParams.set("mode", "remote");
            u.searchParams.set("roomId", currentRoomId);
            u.searchParams.set("role", window.gameRole);
            u.searchParams.set("host", msg.host);
            window.history.pushState({}, "", u.toString());
            renderRemoteGame(ws, window.gameRole, currentRoomId);
        }
        if (msg.type === "error") {
            if (msg.content === "La salle est pleine") {
                roomStatus.textContent = t("Remote_RoomFull");
                roomStatus.classList.add("text-red-500");
                setTimeout(() => {
                    roomInfo.classList.add("hidden");
                    roomContainer.classList.remove("hidden");
                    roomStatus.classList.remove("text-red-500");
                    roomStatus.textContent = t("Remote_WaitingPlayer");
                }, 3000);
            }
            else {
                alert(msg.content);
            }
        }
    };
    createBtn.onclick = () => {
        if (isConnecting) {
            roomStatus.textContent = t("Remote_Connecting");
            return;
        }
        if (userState.currentUsername === "anonymous") {
            roomStatus.textContent = t("Remote_PleaseLogin");
            roomStatus.classList.add("text-red-500");
            setTimeout(() => {
                roomStatus.classList.remove("text-red-500");
                roomStatus.textContent = t("Remote_WaitingPlayer");
            }, 3000);
            return;
        }
        // Récupérer et sauvegarder le score choisi par l'hôte
        const scoreInput = document.getElementById("win-score");
        const score = scoreInput?.value || "5";
        localStorage.setItem("remoteScore", score);
        const w = getWebSocket();
        w.send(JSON.stringify({ type: "create_room" }));
    };
    joinBtn.onclick = () => {
        const id = joinInput.value.trim().toUpperCase();
        if (!id)
            return;
        if (isConnecting) {
            roomStatus.textContent = t("Remote_Connecting");
            return;
        }
        if (userState.currentUsername === "anonymous") {
            roomStatus.textContent = t("Remote_PleaseLogin");
            roomStatus.classList.add("text-red-500");
            setTimeout(() => {
                roomStatus.classList.remove("text-red-500");
                roomStatus.textContent = t("Remote_WaitingPlayer");
            }, 3000);
            return;
        }
        currentRoomId = id;
        const w = getWebSocket();
        w.send(JSON.stringify({ type: "join_room", roomId: id }));
        roomStatus.textContent = t("Remote_ConnectingToRoom");
        showRoomInfo();
    };
    copyLinkBtn.onclick = async () => {
        const u = new URL(window.location.href);
        u.searchParams.set("mode", "remote");
        u.searchParams.set("roomId", currentRoomId);
        u.searchParams.set("role", "guest");
        // Ajouter le score défini par l'hôte
        const score = localStorage.getItem("remoteScore") || "5";
        u.searchParams.set("score", score);
        await navigator.clipboard.writeText(u.toString());
        copyLinkBtn.textContent = t("Remote_LinkCopied");
        setTimeout(() => (copyLinkBtn.textContent = t("Remote_CopyLink")), 2000);
    };
}
function renderRemoteColorPicker() {
    const app = document.getElementById("app");
    if (!app)
        return;
    // Vérifier si on arrive depuis un lien d'invitation avec le score
    const url = new URL(window.location.href);
    const scoreFromUrl = url.searchParams.get("score");
    if (scoreFromUrl) {
        localStorage.setItem("remoteScore", scoreFromUrl);
    }
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
      <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-lg w-full bg-pink-50 bg-opacity-95 shadow-lg border-2 border-purple-300">
          <div class="bg-purple-600 text-pink-100 p-3">
            <h1 class="text-xl font-bold text-center" data-i18n="Remote_Title">Pong Remote</h1>
          </div>
          <div class="p-6">
            <form id="color-picker-form" class="space-y-6">

              <!-- Choix de raquette -->
              <div>
                <h3 class="text-purple-600 font-bold text-center mb-2">Choisissez votre raquette</h3>
                <div class="pt-4 flex justify-center gap-2 flex-wrap">
                  ${["bleu", "vert", "jaune", "orange", "rose", "rouge", "violet", "gris"].map(c => `
                    <label>
                      <input type="radio" name="myColor" value="${c}" ${c === "bleu" ? "checked" : ""} class="hidden">
                      <img src="/images/raquette_${c}.png" class="paddle-option cursor-pointer w-7 h-24 border-2 ${c === "bleu" ? "border-purple-400" : "border-transparent"} rounded" />
                    </label>
                  `).join("")}
                </div>
              </div>

              <div class="pt-4 flex justify-center">
                <button type="submit" class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                  text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                  active:shadow-none active:translate-y-[2px] active:border-purple-300 transition-all duration-100" data-i18n="Start">
                  Continuer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
    // Appliquer les traductions
    updateUI();
    // Gestion visuelle des sélections de raquettes
    const updateHighlight = () => {
        document.querySelectorAll('input[name="myColor"]').forEach(r => {
            const img = r.nextElementSibling;
            if (img)
                img.style.borderColor = r.checked ? "#9e8bb0ff" : "transparent";
        });
    };
    document.querySelectorAll('input[name="myColor"]').forEach(input => {
        input.addEventListener("change", () => updateHighlight());
    });
    // Soumission du formulaire
    const form = document.getElementById("color-picker-form");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const myColor = formData.get("myColor") || "bleu";
        // Rediriger vers la page remote avec la couleur choisie
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("myColor", myColor);
        window.history.pushState({}, "", newUrl.toString());
        renderRemoteRoom();
    });
}
