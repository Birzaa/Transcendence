import { navigate, userState } from "../main.js";
import { t, updateUI } from "../utils/i18n.js";

type Role = 'host' | 'guest';

interface WsMsgGameState {
  type: 'game_state';
  roomId: string;
  state: {
    ballX: number; ballY: number;
    p1Y: number; p2Y: number;
    s1: number; s2: number;
    waitingForServe: boolean;
  };
}

interface WsMsgPaddleMove {
  type: 'paddle_move';
  roomId: string;
  player: 'host' | 'guest'; 
  y: number;
}

interface WsMsgGameEnd {
  type: 'game_end';
  roomId: string;
  winner: string;
  player1Score?: number;
  player2Score?: number;
  duration?: number;
}

interface WsMsgPlayerColor {
  type: 'player_color';
  roomId: string;
  player: 'host' | 'guest';
  color: string;
}

interface WsMsgPlayerInfo {
  type: 'player_info';
  roomId: string;
  player: 'host' | 'guest';
  username: string;
}

export function renderRemoteGame(ws: WebSocket, role: Role, roomId: string): void {
  // Nettoyer la room précédente si elle existe
  const previousCleanup = (window as any).__remoteGameCleanup;
  if (previousCleanup && typeof previousCleanup === 'function') {
    previousCleanup();
  }

  const app = document.getElementById('app');
  if (!app) return;

  // Récupérer les options depuis localStorage
  const myColor = localStorage.getItem("myRemoteColor") || "bleu";
  const WIN_SCORE = parseInt(localStorage.getItem("remoteScore") || "5", 10);
  const myUsername = userState.currentUsername || "Joueur";

  // L'hôte est paddle1 (gauche), le guest est paddle2 (droite)
  const color1 = role === 'host' ? myColor : "rose"; // Host utilise sa couleur
  const color2 = role === 'guest' ? myColor : "bleu"; // Guest utilise sa couleur

  app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-fixed pt-[190px] pb-4">
      <div class="flex flex-col items-center mx-auto px-4" style="max-width: 800px;">
        <div class="flex justify-between items-center w-full mb-3 gap-2">
          <button id="back-btn"
              data-i18n="Remote_Back"
              class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white
                     text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                     active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
                     active:shadow-none active:translate-y-[2px] transition-all duration-100 text-center">
            ← Retour
          </button>

          <div class="flex-1 flex justify-center items-center gap-4 pixel-font" style="font-size: 1.25rem;">
            <div class="text-center">
              <div id="player1-name" class="text-purple-300 text-xs">${role === 'host' ? myUsername : '...'} (W/S)</div>
              <span id="player1-score" class="text-yellow-300">00</span>
            </div>
            <span class="text-white">:</span>
            <div class="text-center">
              <div id="player2-name" class="text-pink-300 text-xs">${role === 'guest' ? myUsername : '...'} (↑/↓)</div>
              <span id="player2-score" class="text-yellow-300">00</span>
            </div>
          </div>

          <button id="pause-btn"
              data-i18n="Remote_Pause"
              class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white
                     text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                     active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
                     active:shadow-none active:translate-y-[2px] transition-all duration-100">
            Pause
          </button>
        </div>

        <div class="relative w-full bg-purple-100 bg-opacity-30 border-2 border-purple-300" 
            id="game-container" style="height: 400px;">
            <img id="ball"
               src="/images/ball.png"
               class="absolute"
               style="width: 30px; height: 30px;"
               alt="ball">
          <img id="paddle1"
               src="/images/raquette_${color1}.png"
               class="absolute left-4"
               style="width: 22px; height: 96px;"
               alt="paddle1">
          <img id="paddle2"
               src="/images/raquette_${color2}.png"
               class="absolute right-4"
               style="width: 22px; height: 96px;"
               alt="paddle2">

          <div id="net" class="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-300 transform -translate-x-1/2 
                      flex flex-col items-center justify-between py-2">
            ${Array(8).fill('<div class="h-6 w-full bg-purple-400"></div>').join('')}
          </div>
        </div>
      </div>

      <img src="/images/logo.png" class="fixed left-4 bottom-4 w-14 h-14 animate-float" alt="Chat kawaii">
    </div>
  `;

  // Appliquer les traductions
  updateUI();

  const style = document.createElement('style');
  style.textContent = `
    .pixel-font { font-family: 'Press Start 2P', cursive; letter-spacing: 1px; }
    @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    .animate-float { animation: float 2s ease-in-out infinite; }

    #ball { z-index: 10; }
    #net { z-index: 1; }
  `;
  document.head.appendChild(style);

  initRemoteGame(ws, role, roomId, WIN_SCORE, myUsername);
}

function initRemoteGame(ws: WebSocket, role: Role, roomId: string, WIN_SCORE: number, myUsername: string) {
  const gameContainer = document.getElementById('game-container')!;
  const paddle1 = document.getElementById('paddle1')! as HTMLImageElement;
  const paddle2 = document.getElementById('paddle2')! as HTMLImageElement;
  const ball = document.getElementById('ball')!;
  const score1El = document.getElementById('player1-score')!;
  const score2El = document.getElementById('player2-score')!;
  const pauseBtn = document.getElementById('pause-btn')!;
  const player1NameEl = document.getElementById('player1-name')!;
  const player2NameEl = document.getElementById('player2-name')!;

  // Stocker les noms des joueurs
  let hostUsername = role === 'host' ? myUsername : '';
  let guestUsername = role === 'guest' ? myUsername : '';

  let gameWidth = gameContainer.clientWidth;
  let gameHeight = gameContainer.clientHeight;
  let paddleHeight = paddle1.offsetHeight;
  let ballSize = ball.offsetWidth;

  let p1Y = (gameHeight - paddleHeight) / 2;
  let p2Y = (gameHeight - paddleHeight) / 2;
  let ballX = (gameWidth - ballSize) / 2;
  let ballY = (gameHeight - ballSize) / 2;
  let ballVX = 0;
  let ballVY = 0;

  let s1 = 0;
  let s2 = 0;
  let waitingForServe = true;
  let gamePaused = false;
  let gameEnded = false;
  let gameStartTime = Date.now();

  const keys: Record<string, boolean> = {};
  document.addEventListener('keydown', e => keys[e.key] = true);
  document.addEventListener('keyup', e => keys[e.key] = false);

  let lastSentP2Y = p2Y;
  const PADDLE_MOVE_THRESHOLD = 2;

  // Envoyer ma couleur à l'autre joueur via WebSocket
  const myColor = localStorage.getItem("myRemoteColor") || "bleu";

  // Fonction pour envoyer la couleur
  const sendMyColor = () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'player_color',
        roomId,
        player: role,
        color: myColor
      }));
      console.log(`[remoteGame] Couleur envoyée: ${role} = ${myColor}`);
    } else {
      // Réessayer si le WebSocket n'est pas encore ouvert
      setTimeout(sendMyColor, 100);
    }
  };

  // Envoyer la couleur avec un petit délai pour s'assurer que la room est bien établie
  setTimeout(sendMyColor, 200);

  // Fonction pour envoyer le username
  const sendMyUsername = () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'player_info',
        roomId,
        player: role,
        username: myUsername
      }));
      console.log(`[remoteGame] Username envoyé: ${role} = ${myUsername}`);
    } else {
      setTimeout(sendMyUsername, 100);
    }
  };

  // Envoyer le username après la couleur
  setTimeout(sendMyUsername, 250);

  // 📡 Réception messages WS
  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data) as WsMsgGameState | WsMsgPaddleMove | WsMsgGameEnd | WsMsgPlayerColor | WsMsgPlayerInfo;

      if (msg.type === 'game_state' && role === 'guest') {
        ({ s1, s2, waitingForServe } = msg.state);
        ballX = ballX + (msg.state.ballX - ballX) * 0.4;
        ballY = ballY + (msg.state.ballY - ballY) * 0.4;
        p1Y = p1Y + (msg.state.p1Y - p1Y) * 0.6;
        p2Y = p2Y + (msg.state.p2Y - p2Y) * 0.6;
        updatePositions();
      }

      if (msg.type === 'paddle_move' && role === 'host' && msg.player === 'guest') {
        p2Y = p2Y + (clampY(msg.y) - p2Y) * 0.7;
      }

      // Réception de la couleur de l'adversaire
      if (msg.type === 'player_color') {
        console.log(`[remoteGame] Couleur reçue: ${msg.player} = ${msg.color}, je suis ${role}`);
        if (msg.player === 'host' && role === 'guest') {
          // Le guest reçoit la couleur de l'hôte
          console.log(`[remoteGame] Guest met à jour paddle1 (gauche) avec couleur ${msg.color}`);
          paddle1.src = `/images/raquette_${msg.color}.png`;
        } else if (msg.player === 'guest' && role === 'host') {
          // L'hôte reçoit la couleur du guest
          console.log(`[remoteGame] Host met à jour paddle2 (droite) avec couleur ${msg.color}`);
          paddle2.src = `/images/raquette_${msg.color}.png`;
        }
      }

      // Réception du username de l'adversaire
      if (msg.type === 'player_info') {
        console.log(`[remoteGame] Username reçu: ${msg.player} = ${msg.username}, je suis ${role}`);
        if (msg.player === 'host' && role === 'guest') {
          // Le guest reçoit le username de l'hôte
          hostUsername = msg.username;
          player1NameEl.textContent = `${hostUsername} (W/S)`;
        } else if (msg.player === 'guest' && role === 'host') {
          // L'hôte reçoit le username du guest
          guestUsername = msg.username;
          player2NameEl.textContent = `${guestUsername} (↑/↓)`;
        }
      }

      // Le guest reçoit la notification de fin de partie
      if (msg.type === 'game_end') {
        endGame(msg.winner);
      }
    } catch (e) {
      console.error('Error parsing WS message:', e);
    }
  });

  ws.addEventListener('error', (e) => {
    console.error('WS error', e);
    if (!gameEnded) {
      endGame(t('Remote_Nobody'));
      alert(t('Remote_ConnectionLostAlert'));
    }
  });

  ws.addEventListener('close', (e) => {
    console.warn('WS closed', e);
    if (!gameEnded) {
      endGame(t('Remote_Nobody'));
      const overlay = document.querySelector('.fixed.inset-0') as HTMLElement;
      if (overlay) {
        const message = overlay.querySelector('.text-lg') as HTMLElement;
        if (message) {
          message.textContent = t('Remote_ConnectionLost');
        }
      }
    }
  });

  function clampY(y: number) {
    return Math.min(Math.max(0, y), gameHeight - paddleHeight);
  }

  function serveBall() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    ballVX = 4 * dir;
    ballVY = (Math.random() * 4) - 2;
    waitingForServe = false;
  }

  function resetBall() {
    ballX = (gameWidth - ballSize) / 2;
    ballY = (gameHeight - ballSize) / 2;
    ballVX = 0;
    ballVY = 0;
    waitingForServe = true;
  }

  function endGame(winner: string) {
    gamePaused = true;

    if (role === 'host' && ws.readyState === WebSocket.OPEN) {
        const duration = Math.floor((Date.now() - gameStartTime) / 1000); // Durée en secondes
        
        ws.send(JSON.stringify( { type: 'game_end', roomId, score1: s1, score2: s2, duration } ));
    }
    gameEnded = true;
  
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center";
  
    overlay.innerHTML = `
      <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
        <!-- Barre violette avec titre -->
        <div class="bg-purple-600 text-pink-100 p-3">
          <h1 class="text-xl font-bold text-center" data-i18n="1vs1_Result_partie">
            Résultat de la partie
          </h1>
        </div>

        <!-- Contenu principal -->
        <div class="p-6 text-center">
          <h2 class="text-lg font-semibold text-purple-700 mb-6" id="winner-text" data-winner="${winner}" data-i18n="WinnerMessage">
            ☆ ${winner} gagne la partie ! ☆
          </h2>
          <button id="back-to-menu"
            data-i18n="Remote_BackToMenu"
            class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                   text-purple-800 font-bold
                   shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                   active:shadow-none active:translate-y-[2px] active:border-purple-300
                   transition-all duration-100">
            ← Retour au menu
          </button>
        </div>
      </div>
    `;
  
    document.body.appendChild(overlay);
    updateUI(); // Appliquer les traductions au modal

    const backBtn = overlay.querySelector('#back-to-menu') as HTMLButtonElement;
    backBtn.addEventListener('click', () => {
      overlay.remove();
      navigate('/');
    });
  }   
  
  function sendStateFromHost() {
    if (ws.readyState === WebSocket.OPEN && role === 'host') {
      const payload: WsMsgGameState = {
        type: 'game_state',
        roomId,
        state: { ballX, ballY, p1Y, p2Y, s1, s2, waitingForServe }
      };
      ws.send(JSON.stringify(payload));
    }
  }

  function sendGuestPaddleIfNeeded() {
    if (role !== 'guest' || ws.readyState !== WebSocket.OPEN) return;
    if (Math.abs(p2Y - lastSentP2Y) > PADDLE_MOVE_THRESHOLD) {
      const msg: WsMsgPaddleMove = { 
        type: 'paddle_move', 
        roomId, 
        player: role, 
        y: p2Y 
      };
      ws.send(JSON.stringify(msg));
      lastSentP2Y = p2Y;
    }
  }

function handleCollisions() {
    if (ballY <= 0 || ballY + ballSize >= gameHeight) ballVY *= -1;

    if (ballX <= paddle1.offsetLeft + paddle1.offsetWidth &&
        ballY + ballSize >= p1Y && ballY <= p1Y + paddleHeight) {
      ballX = paddle1.offsetLeft + paddle1.offsetWidth;
      ballVX = Math.abs(ballVX);
      const hit = ((ballY + ballSize/2) - (p1Y + paddleHeight/2)) / (paddleHeight/2);
      ballVY = hit * Math.max(3, Math.abs(ballVX));
    }

    if (ballX + ballSize >= (gameWidth - (paddle2 as HTMLElement).offsetWidth - 16) &&
        ballY + ballSize >= p2Y && ballY <= p2Y + paddleHeight) {
      ballX = gameWidth - (paddle2 as HTMLElement).offsetWidth - 16 - ballSize;
      ballVX = -Math.abs(ballVX);
      const hit = ((ballY + ballSize/2) - (p2Y + paddleHeight/2)) / (paddleHeight/2);
      ballVY = hit * Math.max(3, Math.abs(ballVX));
    }

    if (ballX < 0) {
      s2++;
      if (s2 >= WIN_SCORE) {
        // AJOUT: Le host envoie la notification au guest
        const winnerName = guestUsername || "Joueur 2";
        if (role === 'host' && ws.readyState === WebSocket.OPEN) {
          const endMsg: WsMsgGameEnd = {
            type: 'game_end',
            roomId,
            winner: winnerName
          };
          ws.send(JSON.stringify(endMsg));
        }
        endGame(winnerName);
      }
      else resetBall();
    }
    if (ballX > gameWidth) {
      s1++;
      if (s1 >= WIN_SCORE) {
        // AJOUT: Le host envoie la notification au guest
        const winnerName = hostUsername || "Joueur 1";
        if (role === 'host' && ws.readyState === WebSocket.OPEN) {
          const endMsg: WsMsgGameEnd = {
            type: 'game_end',
            roomId,
            winner: winnerName
          };
          ws.send(JSON.stringify(endMsg));
        }
        endGame(winnerName);
      }
      else resetBall();
    }
  }

  function updatePositions() {
    paddle1.style.top = `${p1Y}px`;
    paddle2.style.top = `${p2Y}px`;
    ball.style.left = `${Math.round(ballX)}px`;
    ball.style.top = `${Math.round(ballY)}px`;
    score1El.textContent = String(s1).padStart(2, '0');
    score2El.textContent = String(s2).padStart(2, '0');
  }

  function loop() {
    if (!gamePaused && !gameEnded) {
      if (role === 'host') {
        if (keys['w']) p1Y = clampY(p1Y - 6);
        if (keys['s']) p1Y = clampY(p1Y + 6);

        if (waitingForServe && (keys['w'] || keys['s'])) serveBall();

        if (!waitingForServe) {
          ballX += ballVX;
          ballY += ballVY;
          handleCollisions();
        }
        sendStateFromHost();
      } else {
        const moveSpeed = 10;
        if (keys['ArrowUp']) p2Y = clampY(p2Y - moveSpeed);
        if (keys['ArrowDown']) p2Y = clampY(p2Y + moveSpeed);
        sendGuestPaddleIfNeeded();
      }
      updatePositions();
    }
    requestAnimationFrame(loop);
  }

  pauseBtn.addEventListener('click', () => {
    if (!gameEnded) {
      gamePaused = !gamePaused;
      (pauseBtn as HTMLButtonElement).textContent = gamePaused ? t('Remote_Resume') : t('Remote_Pause');
      (pauseBtn as HTMLButtonElement).setAttribute('data-i18n', gamePaused ? 'Remote_Resume' : 'Remote_Pause');
    }
  });

  // Fonction de nettoyage qui sera appelée quand on quitte la page
  const cleanup = () => {
    if (!gameEnded && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leave_game', roomId }));
      console.log('[remoteGame] leave_game envoyé');
    }
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('resize', handleResize);
  };

  // Stocker la fonction de nettoyage globalement dans window
  (window as any).__remoteGameCleanup = cleanup;

  // Gestion du bouton retour
  const backBtn = document.getElementById('back-btn')!;
  backBtn.addEventListener('click', () => {
    cleanup();
    navigate('/');
  });

  // Gestion de la fermeture de la page/tab
  const handleBeforeUnload = () => {
    if (!gameEnded && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leave_game', roomId }));
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  const handleResize = () => {
    gameWidth = gameContainer.clientWidth;
    gameHeight = gameContainer.clientHeight;
    paddleHeight = paddle1.offsetHeight;
    ballSize = ball.offsetWidth;
    if (waitingForServe) resetBall();
    updatePositions();
  };
  window.addEventListener('resize', handleResize);

  if (role === 'host') serveBall(); // ⚡ partie démarre direct
  updatePositions();
  loop();
}