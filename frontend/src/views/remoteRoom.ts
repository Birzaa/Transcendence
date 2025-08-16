import { navigate } from "../main.js";

export function renderRemoteRoom(): void {
    // Supprimer le menu existant
    const existingMenu = document.getElementById('game-menu-container');
    if (existingMenu) existingMenu.remove();

    // Définir WS_URL
    const WS_URL = (() => {
        const u = new URL(window.location.href);
        const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${proto}//${u.host}/ws`;
    })();

    const app = document.getElementById('app');
    if (!app) return;
  
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4 pt-[110px]">
      <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300 relative">
          <!-- Chat décoratif -->
          <img src="/images/logo.png" class="absolute -top-4 -right-4 w-12 h-12 rotate-12" alt="Petit chat">

          <!-- Titre -->
          <div class="bg-purple-600 text-pink-100 p-3">
            <h1 class="text-xl font-bold text-center">Pong Remote (=^･ω･^=)</h1>
          </div>

          <div class="p-6 space-y-6">
            <!-- Section Créer une salle -->
            <div id="room-container" class="space-y-4">
              <h3 class="font-bold text-purple-800 flex items-center">
                <span class="text-purple-300 mr-2">☆</span> Créer une partie
              </h3>
              <button id="create-room" 
                class="relative px-6 py-3 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                  text-purple-800 font-bold w-full
                  shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                  active:shadow-none active:translate-y-[2px] active:border-purple-300
                  transition-all duration-100">
                Créer une salle
              </button>
            </div>

            <!-- Section Rejoindre -->
            <div class="space-y-4">
              <h3 class="font-bold text-purple-800 flex items-center">
                <span class="text-purple-300 mr-2">☆</span> Rejoindre une partie
              </h3>
              <div class="flex gap-2">
                <input id="join-room-id" type="text" placeholder="Code salle" 
                  class="flex-1 border-2 border-purple-300 px-3 py-2 bg-violet-100 focus:border-purple-400">
                <button id="join-room"
                  class="relative px-6 py-2 bg-baby-pink border-2 border-t-white border-l-white border-r-baby-pink-dark border-b-baby-pink-dark 
                    text-purple-800 font-bold
                    shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                    active:shadow-none active:translate-y-[2px] active:border-baby-pink-dark
                    transition-all duration-100">
                  Rejoindre
                </button>
              </div>
            </div>

            <!-- Info salle (caché par défaut) -->
            <div id="room-info" class="hidden space-y-4 pt-4 border-t border-purple-200">
              <h3 class="font-bold text-purple-800 flex items-center">
                <span class="text-purple-300 mr-2">☆</span> Votre salle
              </h3>
              <div class="bg-violet-100 p-3 border-2 border-purple-300">
                <p id="room-id-display" class="text-center font-mono font-bold text-purple-700"></p>
              </div>
              <button id="copy-link"
                class="relative px-6 py-2 bg-baby-blue border-2 border-t-white border-l-white border-r-darkest-blue border-b-darkest-blue 
                  text-purple-800 font-bold w-full
                  shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                  active:shadow-none active:translate-y-[2px] active:border-darkest-blue
                  transition-all duration-100">
                Copier le lien d'invitation
              </button>
              <p id="room-status" class="text-sm text-center text-purple-600">
                En attente d'un autre joueur... (◕‿◕)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  
    const createBtn = document.getElementById('create-room')!;
    const joinBtn = document.getElementById('join-room')!;
    const joinInput = document.getElementById('join-room-id') as HTMLInputElement;
    const roomContainer = document.getElementById('room-container')!;
    const roomInfo = document.getElementById('room-info')!;
    const roomIdDisplay = document.getElementById('room-id-display')!;
    const copyLinkBtn = document.getElementById('copy-link')!;
    const roomStatus = document.getElementById('room-status')!;
  
    let currentRoomId = '';
    let role: 'host' | 'guest' = 'guest';
    let ws: WebSocket;
    let isConnecting = false;

    function connectWebSocket() {
        if (ws && ws.readyState === WebSocket.OPEN) return ws;
        
        ws = new WebSocket(WS_URL);
        isConnecting = true;
        
        ws.onopen = () => {
            console.log('Connected to WS');
            isConnecting = false;
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            isConnecting = false;
            roomStatus.textContent = "Erreur de connexion au serveur (╥﹏╥)";
            roomStatus.classList.add('text-red-500');
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            
            if (msg.type === 'room_created') {
                currentRoomId = msg.roomId;
                role = 'host';
                showRoomInfo();
                roomStatus.textContent = "En attente d'un adversaire... (=｀ω´=)";
            }
            
            if (msg.type === 'room_joined') {
                // Le guest a bien rejoint la salle
                role = 'guest';
                showRoomInfo();
                roomStatus.textContent = "Connecté à la salle ! Attente du lancement...";
            }
            
            if (msg.type === 'game_start') {
                // Rediriger vers le jeu pour les DEUX joueurs
                const u = new URL(window.location.href);
                u.searchParams.set('mode', 'remote');
                u.searchParams.set('roomId', currentRoomId);
                u.searchParams.set('role', role);
                u.searchParams.set('host', msg.host);
                navigate(u.toString());
            }
            
            if (msg.type === 'error') {
                if (msg.content === 'La salle est pleine') {
                    roomStatus.textContent = "Désolé, la salle est déjà complète ! (╥﹏╥)";
                    roomStatus.classList.add('text-red-500');
                    setTimeout(() => {
                        roomInfo.classList.add('hidden');
                        roomContainer.classList.remove('hidden');
                        roomStatus.classList.remove('text-red-500');
                        roomStatus.textContent = "En attente d'un autre joueur... (◕‿◕)";
                    }, 3000);
                } else {
                    alert(msg.content);
                }
            }
        };

        return ws;
    }

    // Se connecter dès le chargement
    connectWebSocket();
  
    createBtn.onclick = () => {
        if (isConnecting) {
            roomStatus.textContent = "Connexion en cours, veuillez patienter...";
            return;
        }
        
        const ws = connectWebSocket();
        ws.send(JSON.stringify({ 
            type: 'set_username', 
            username: `host${Date.now()}`,
            isGame: true 
        }));
        ws.send(JSON.stringify({ type: 'create_room' }));
    };
  
    joinBtn.onclick = () => {
        const id = joinInput.value.trim().toUpperCase();
        if (!id) return;
        
        if (isConnecting) {
            roomStatus.textContent = "Connexion en cours, veuillez patienter...";
            return;
        }

        currentRoomId = id;
        role = 'guest';
        
        const ws = connectWebSocket();
        ws.send(JSON.stringify({ 
            type: 'set_username', 
            username: `guest${Date.now()}`,
            isGame: true 
        }));
        ws.send(JSON.stringify({ type: 'join_room', roomId: id }));
        
        // Afficher un message de connexion immédiatement
        roomStatus.textContent = "Connexion à la salle...";
        showRoomInfo();
    };
  
    copyLinkBtn.onclick = async () => {
      const u = new URL(window.location.href);
      u.searchParams.set('mode', 'remote');
      u.searchParams.set('roomId', currentRoomId);
      u.searchParams.set('role', 'guest');
      await navigator.clipboard.writeText(u.toString());
      copyLinkBtn.textContent = 'Lien copié ! ✓';
      setTimeout(() => (copyLinkBtn.textContent = 'Copier le lien d\'invitation'), 2000);
    };
  
    function showRoomInfo() {
      roomContainer.classList.add('hidden');
      roomInfo.classList.remove('hidden');
      roomIdDisplay.textContent = currentRoomId;
    }
}