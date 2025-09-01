type Role = 'host' | 'guest';

interface WsMsgGameState {
  type: 'game_state';
  state: any;
}

const WS_URL = (() => {
  const u = new URL(window.location.href);
  const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${u.host}/ws`;
})();

export function renderRemoteGame(): void {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId') || '';
  const role: Role = (params.get('role') as Role) || 'host';

  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-fixed pt-[190px] pb-4">
      <div class="flex flex-col items-center mx-auto px-4" style="max-width: 800px;">
        <!-- Barre de contrôle -->
        <div class="flex justify-between items-center w-full mb-3 gap-2">
          <button onclick="window.navigate('/')" 
              class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
                     text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                     active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
                     active:shadow-none active:translate-y-[2px] transition-all duration-100 text-center">
            ← Retour
          </button>

          <!-- Scores -->
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

        <!-- Terrain -->
        <div class="relative w-full bg-purple-100 bg-opacity-30 border-2 border-purple-300" 
            id="game-container" 
            style="height: 400px;">
          <div id="paddle1" class="absolute w-3 h-20 bg-purple-400 left-4"></div>
          <div id="paddle2" class="absolute w-3 h-20 bg-pink-400 right-4"></div>
          <div id="ball" class="absolute w-5 h-5 bg-yellow-300 rounded-sm shadow-md"></div>

          <!-- Filet -->
          <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-300 transform -translate-x-1/2 
                      flex flex-col items-center justify-between py-2">
            ${Array(8).fill('<div class="h-6 w-full bg-purple-400"></div>').join('')}
          </div>
        </div>
      </div>

      <img src="/images/logo.png" 
          class="fixed left-4 bottom-4 w-14 h-14 animate-float"
          alt="Chat kawaii">
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .pixel-font { font-family: 'Press Start 2P', cursive; letter-spacing: 1px; }
    @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    .animate-float { animation: float 2s ease-in-out infinite; }
  `;
  document.head.appendChild(style);

  initRemoteGame(role, roomId);
}

function initRemoteGame(role: Role, roomId: string) {
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

  // WebSocket
  const ws = new WebSocket(WS_URL);
  ws.onopen = () => {
    console.log('WS connected');
    ws.send(JSON.stringify({ type: 'set_username', username: role + Date.now(), isGame: true }));
  };
  ws.onmessage = (event) => {
    const msg: WsMsgGameState = JSON.parse(event.data);
    if (msg.type === 'game_state' && role === 'guest') {
      ({ ballX, ballY, p1Y, p2Y, s1, s2, waitingForServe } = msg.state);
    }
  };
  ws.onerror = (err) => console.error('WS error', err);
  ws.onclose = () => console.warn('WS closed');

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

  function sendState() {
    if (ws.readyState === WebSocket.OPEN && role === 'host') {
      ws.send(JSON.stringify({
        type: 'game_state',
        roomId,
        state: { ballX, ballY, p1Y, p2Y, s1, s2, waitingForServe }
      }));
    }
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
    if (ballX + ballSize >= paddle2.offsetLeft &&
        ballY + ballSize >= p2Y && ballY <= p2Y + paddleHeight) {
      ballX = paddle2.offsetLeft - ballSize;
      ballVX = -Math.abs(ballVX);
      const hit = ((ballY + ballSize/2) - (p2Y + paddleHeight/2)) / (paddleHeight/2);
      ballVY = hit * Math.max(3, Math.abs(ballVX));
    }

    // score
    if (ballX < 0) { s2++; resetBall(); }
    if (ballX > gameWidth) { s1++; resetBall(); }
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
    if (!gamePaused) {
        // --- Déplacement paddles selon rôle ---
        if (role === 'host') {
            // Host contrôle le paddle 1
            if (keys['w']) p1Y = Math.max(0, p1Y - 6);
            if (keys['s']) p1Y = Math.min(gameHeight - paddleHeight, p1Y + 6);

            // Host sert la balle
            if (waitingForServe && (keys['w'] || keys['s'])) {
                serveBall();
            }

            // Déplacement balle et collisions
            if (!waitingForServe) {
                ballX += ballVX;
                ballY += ballVY;
                handleCollisions();
            }

            // Envoie l'état du jeu au guest
            sendState();

        } else if (role === 'guest') {
            // Guest contrôle le paddle 2
            if (keys['ArrowUp']) p2Y = Math.max(0, p2Y - 6);
            if (keys['ArrowDown']) p2Y = Math.min(gameHeight - paddleHeight, p2Y + 6);
        }

        // --- Mise à jour de l'affichage ---
        paddle1.style.top = `${p1Y}px`;
        paddle2.style.top = `${p2Y}px`;
        ball.style.left = `${Math.round(ballX)}px`;
        ball.style.top = `${Math.round(ballY)}px`;
        score1El.textContent = String(s1).padStart(2, '0');
        score2El.textContent = String(s2).padStart(2, '0');
    }

    requestAnimationFrame(loop);
}


  // clic pour servir la balle
  gameContainer.addEventListener('click', () => {
    if (waitingForServe && role === 'host') serveBall();
  });

  pauseBtn.addEventListener('click', () => {
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
  });

  window.addEventListener('resize', () => {
    gameWidth = gameContainer.clientWidth;
    gameHeight = gameContainer.clientHeight;
    paddleHeight = paddle1.offsetHeight;
    ballSize = ball.offsetWidth;
    if (waitingForServe) resetBall();
    updatePositions();
  });

  // démarrage immédiat host
  if (role === 'host') serveBall();
  loop();
}
