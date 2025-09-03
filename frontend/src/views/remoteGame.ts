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

export function renderRemoteGame(ws: WebSocket, role: Role, roomId: string): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-fixed pt-[190px] pb-4">
      <div class="flex flex-col items-center mx-auto px-4" style="max-width: 800px;">
        <div class="flex justify-between items-center w-full mb-3 gap-2">
          <button onclick="window.navigate('/')" 
              class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
                     text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                     active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
                     active:shadow-none active:translate-y-[2px] transition-all duration-100 text-center">
            ← Retour
          </button>

          <div class="flex-1 flex justify-center items-center gap-4 pixel-font" style="font-size: 1.25rem;">
            <div class="text-center">
              <div class="text-purple-300 text-xs">JOUEUR 1 (W/S)</div>
              <span id="player1-score" class="text-yellow-300">00</span>
            </div>
            <span class="text-white">:</span>
            <div class="text-center">
              <div class="text-pink-300 text-xs">JOUEUR 2 (↑/↓)</div>
              <span id="player2-score" class="text-yellow-300">00</span>
            </div>
          </div>

          <button id="pause-btn" 
              class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
                     text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                     active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
                     active:shadow-none active:translate-y-[2px] transition-all duration-100">
            Pause
          </button>
        </div>

        <div class="relative w-full bg-purple-100 bg-opacity-30 border-2 border-purple-300" 
            id="game-container" style="height: 400px;">
          <div id="paddle1" class="absolute w-3 h-20 bg-purple-400 left-4"></div>
          <div id="paddle2" class="absolute w-3 h-20 bg-pink-400 right-4"></div>
          <div id="ball" class="absolute w-5 h-5 bg-yellow-300 rounded-sm shadow-md"></div>

          <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-300 transform -translate-x-1/2 
                      flex flex-col items-center justify-between py-2">
            ${Array(8).fill('<div class="h-6 w-full bg-purple-400"></div>').join('')}
          </div>
        </div>
      </div>

      <img src="/images/logo.png" class="fixed left-4 bottom-4 w-14 h-14 animate-float" alt="Chat kawaii">
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .pixel-font { font-family: 'Press Start 2P', cursive; letter-spacing: 1px; }
    @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    .animate-float { animation: float 2s ease-in-out infinite; }
  `;
  document.head.appendChild(style);

  initRemoteGame(ws, role, roomId);
}

function initRemoteGame(ws: WebSocket, role: Role, roomId: string) {
  // DOM elements
  const gameContainer = document.getElementById('game-container')!;
  const paddle1 = document.getElementById('paddle1')!;
  const paddle2 = document.getElementById('paddle2')!;
  const ball = document.getElementById('ball')!;
  const score1El = document.getElementById('player1-score')!;
  const score2El = document.getElementById('player2-score')!;
  const pauseBtn = document.getElementById('pause-btn')!;

  // dimensions et positions
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

  const keys: Record<string, boolean> = {};
  document.addEventListener('keydown', e => keys[e.key] = true);
  document.addEventListener('keyup', e => keys[e.key] = false);

  // réutiliser le WS existant (AUCUNE nouvelle connexion ici)
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data) as WsMsgGameState | WsMsgPaddleMove;

    if (msg.type === 'game_state') {
      if (role === 'guest') {
        // le guest suit l'état envoyé par le host
        ({ ballX, ballY, p1Y, p2Y, s1, s2, waitingForServe } = msg.state);
        updatePositions();
      }
    }

    if (msg.type === 'paddle_move') {
      // le host récupère la position du paddle du guest
      if (role === 'host' && msg.player === 'guest') {
        p2Y = clampY(msg.y);
      }
      // (optionnel) le guest peut appliquer la position du host si on l'envoyait, mais
      // le host renvoie déjà un game_state complet.
    }
  };

  ws.onerror = (err) => console.error('WS error', err);
  ws.onclose = () => console.warn('WS closed');

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

  // petit throttle pour ne pas spammer les updates de paddle guest
  let lastGuestSend = 0;
  function sendGuestPaddleIfNeeded() {
    if (role !== 'guest' || ws.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    if (now - lastGuestSend < 16) return; // ~60fps max
    lastGuestSend = now;
    const msg: WsMsgPaddleMove = { type: 'paddle_move', roomId, player: 'guest', y: p2Y };
    ws.send(JSON.stringify(msg));
  }

  function handleCollisions() {
    // murs haut/bas
    if (ballY <= 0 || ballY + ballSize >= gameHeight) ballVY *= -1;

    // paddle1
    if (ballX <= paddle1.offsetLeft + paddle1.offsetWidth &&
        ballY + ballSize >= p1Y && ballY <= p1Y + paddleHeight) {
      ballX = paddle1.offsetLeft + paddle1.offsetWidth;
      ballVX = Math.abs(ballVX);
      const hit = ((ballY + ballSize/2) - (p1Y + paddleHeight/2)) / (paddleHeight/2);
      ballVY = hit * Math.max(3, Math.abs(ballVX));
    }

    // paddle2
    if (ballX + ballSize >= (gameWidth - (paddle2 as HTMLElement).offsetWidth - 16) && // approx right-4
        ballY + ballSize >= p2Y && ballY <= p2Y + paddleHeight) {
      ballX = gameWidth - (paddle2 as HTMLElement).offsetWidth - 16 - ballSize;
      ballVX = -Math.abs(ballVX);
      const hit = ((ballY + ballSize/2) - (p2Y + paddleHeight/2)) / (paddleHeight/2);
      ballVY = hit * Math.max(3, Math.abs(ballVX));
    }

    // score
    if (ballX < 0) { s2++; resetBall(); }
    if (ballX > gameWidth) { s1++; resetBall(); }
  }

  function updatePositions() {
    (paddle1 as HTMLElement).style.top = `${p1Y}px`;
    (paddle2 as HTMLElement).style.top = `${p2Y}px`;
    (ball as HTMLElement).style.left = `${Math.round(ballX)}px`;
    (ball as HTMLElement).style.top = `${Math.round(ballY)}px`;
    (score1El as HTMLElement).textContent = String(s1).padStart(2, '0');
    (score2El as HTMLElement).textContent = String(s2).padStart(2, '0');
  }

  function loop() {
    if (!gamePaused) {
      // Contrôles
      if (role === 'host') {
        // Host contrôle paddle1
        if (keys['w']) p1Y = clampY(p1Y - 6);
        if (keys['s']) p1Y = clampY(p1Y + 6);

        // Serve
        if (waitingForServe && (keys['w'] || keys['s'])) {
          serveBall();
        }

        // Physique
        if (!waitingForServe) {
          ballX += ballVX;
          ballY += ballVY;
          handleCollisions();
        }

        // Envoi de l'état global
        sendStateFromHost();

      } else {
        // Guest contrôle paddle2 et envoie sa position
        if (keys['ArrowUp']) p2Y = clampY(p2Y - 6);
        if (keys['ArrowDown']) p2Y = clampY(p2Y + 6);
        sendGuestPaddleIfNeeded();
      }

      updatePositions();
    }

    requestAnimationFrame(loop);
  }

  gameContainer.addEventListener('click', () => {
    if (waitingForServe && role === 'host') serveBall();
  });

  pauseBtn.addEventListener('click', () => {
    gamePaused = !gamePaused;
    (pauseBtn as HTMLButtonElement).textContent = gamePaused ? 'Resume' : 'Pause';
  });

  window.addEventListener('resize', () => {
    gameWidth = gameContainer.clientWidth;
    gameHeight = gameContainer.clientHeight;
    paddleHeight = (paddle1 as HTMLElement).offsetHeight;
    ballSize = (ball as HTMLElement).offsetWidth;
    if (waitingForServe) resetBall();
    updatePositions();
  });

  // démarrage immédiat host
  if (role === 'host') serveBall();
  updatePositions();
  loop();
}
