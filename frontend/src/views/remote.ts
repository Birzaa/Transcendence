// frontend/src/views/remote.ts
// Mode Remote : local clavier partagé + amélioration "remote players" via WebSocket (host/guest)

type Role = 'host' | 'guest';

interface WsMsgJoin {
  type: 'join';
  room: string;
  role: Role;
}

interface WsMsgInput {
  type: 'input';
  room: string;
  up: boolean;
  down: boolean;
}

interface WsMsgState {
  type: 'state';
  room: string;
  payload: {
    ballX: number; ballY: number;
    p1Y: number; p2Y: number;
    s1: number; s2: number;
    waitingForServe: boolean;
    gamePaused: boolean;
    gameWidth: number; gameHeight: number; ballSize: number; paddleHeight: number;
  };
}

interface WsMsgServe { type: 'serve'; room: string; }

const WS_URL = (function () {
  try {
    const u = new URL(window.location.href);
    const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${u.host}/ws`;
  } catch { return ''; }
})();

export function renderRemote(): void {
  // Supprime le GameMenu s'il existe
  document.getElementById('game-menu-container')?.remove();

  const app = document.getElementById('app');
  if (!app) return;

  // Charge la police pixel si absente
  if (!document.querySelector('link[href*="Press+Start+2P"]')) {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }

  // Récup params ?room=ABCD&role=host|guest
  const url = new URL(window.location.href);
  let room = (url.searchParams.get('room') || '').trim();
  let role: Role = (url.searchParams.get('role') as Role) || 'host';
  if (!room) {
    room = Math.random().toString(36).slice(2, 6).toUpperCase();
    // on met à jour l'URL pour que tu puisses la copier
    const next = new URL(window.location.href);
    next.searchParams.set('mode', 'remote');
    next.searchParams.set('room', room);
    next.searchParams.set('role', role);
    history.replaceState({}, '', next.toString());
  }

  app.innerHTML = `
  <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-fixed pt-[190px] pb-4">
    <div class="flex flex-col items-center mx-auto px-4" style="max-width: 800px;">
      <!-- Top bar -->
      <div class="flex flex-col w-full gap-2 mb-3">
        <div class="flex justify-between items-center gap-2">
          <button onclick="window.navigate('/')" 
            class="px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
              text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
              active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
              active:shadow-none active:translate-y-[2px] transition-all duration-100">
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
            class="px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
              text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
              active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
              active:shadow-none active:translate-y-[2px] transition-all duration-100">
            Pause
          </button>
        </div>

        <div class="w-full flex items-center justify-between text-xs text-white/80">
          <div class="pixel-font text-[0.6rem]">
            Mode: <span id="modeLabel" class="text-yellow-300">${role.toUpperCase()}</span> • Salle: 
            <span id="roomLabel" class="text-yellow-300">${room}</span>
          </div>
          <div class="flex gap-2">
            <button id="copyInvite" class="px-2 py-1 bg-purple-200 border text-xs">Copier l'invitation</button>
            <span id="wsStatus" class="text-[0.65rem]">WS: …</span>
          </div>
        </div>
      </div>

      <!-- Terrain -->
      <div class="relative w-full bg-purple-100 bg-opacity-30 border-2 border-purple-300" 
           id="game-container" style="height: 400px;">
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

    <img src="/images/logo.png" class="fixed left-4 bottom-4 w-14 h-14 animate-float" alt="Chat kawaii">
  </div>
  `;

  // Styles dynamiques
  const style = document.createElement('style');
  style.textContent = `
    .pixel-font { font-family: 'Press Start 2P', cursive; letter-spacing: 1px; }
    @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    .animate-float { animation: float 2s ease-in-out infinite; }
  `;
  document.head.appendChild(style);

  initRemoteGame(room, role);
}

function initRemoteGame(room: string, role: Role) {
  // ---- DOM
  const ball = document.getElementById('ball')!;
  const paddle1 = document.getElementById('paddle1')!;
  const paddle2 = document.getElementById('paddle2')!;
  const p1ScoreEl = document.getElementById('player1-score')!;
  const p2ScoreEl = document.getElementById('player2-score')!;
  const pauseBtn = document.getElementById('pause-btn')!;
  const gameContainer = document.getElementById('game-container')!;
  const wsStatus = document.getElementById('wsStatus')!;
  const copyInvite = document.getElementById('copyInvite')!;

  // ---- Dimensions
  let gameWidth = gameContainer.clientWidth;
  let gameHeight = gameContainer.clientHeight;
  const paddleHeight = paddle1.offsetHeight || 80;
  const ballSize = ball.offsetWidth || 5;

  // ---- Etat jeu (host = source de vérité)
  let s1 = 0, s2 = 0;
  let p1Y = (gameHeight - paddleHeight) / 2;
  let p2Y = (gameHeight - paddleHeight) / 2;
  let ballX = (gameWidth - ballSize) / 2;
  let ballY = (gameHeight - ballSize) / 2;
  let ballVX = 0, ballVY = 0;

  let gamePaused = false;
  let waitingForServe = true;

  const baseBallSpeed = 4;
  let paddleSpeed = Math.max(6, gameHeight * 0.02);

  // ---- Inputs
  const keys: Record<string, boolean> = {};
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Lancer le service au premier mouvement (host seulement)
    if (role === 'host' && waitingForServe && ['w','s','ArrowUp','ArrowDown'].includes(e.key)) {
      serveBall();
      sendServe();
    }
  });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // ---- WS (optionnel)
  let ws: WebSocket | null = null;
  let wsConnected = false;
  const canUseWS = !!WS_URL;

  function setWsStatus(text: string) { wsStatus.textContent = `WS: ${text}`; }

  if (canUseWS) {
    try {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => {
        wsConnected = true;
        setWsStatus('connecté');
        const join: WsMsgJoin = { type: 'join', room, role };
        ws!.send(JSON.stringify(join));
      };
      ws.onclose = () => { wsConnected = false; setWsStatus('déconnecté'); };
      ws.onerror = () => { wsConnected = false; setWsStatus('erreur'); };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'state' && role === 'guest') {
            const st = (msg as WsMsgState).payload;
            // Guest se contente d'afficher l'état
            ballX = st.ballX; ballY = st.ballY;
            p1Y = st.p1Y; p2Y = st.p2Y;
            s1 = st.s1; s2 = st.s2;
            waitingForServe = st.waitingForServe;
            gamePaused = st.gamePaused;
            gameWidth = st.gameWidth; gameHeight = st.gameHeight;
            draw();
          }
        } catch {}
      };
    } catch {
      setWsStatus('indispo');
    }
  } else {
    setWsStatus('indispo');
  }

  // Copier lien d’invitation (même page, role=guest)
  copyInvite.addEventListener('click', async () => {
    const u = new URL(window.location.href);
    u.searchParams.set('mode', 'remote');
    u.searchParams.set('room', room);
    u.searchParams.set('role', 'guest');
    try {
      await navigator.clipboard.writeText(u.toString());
      copyInvite.textContent = 'Lien copié !';
      setTimeout(()=>copyInvite.textContent='Copier l\'invitation',1500);
    } catch {}
  });

  // ---- Pause
  pauseBtn.addEventListener('click', () => {
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
  });

  // ---- Resize
  window.addEventListener('resize', () => {
    gameWidth = gameContainer.clientWidth;
    gameHeight = gameContainer.clientHeight;
    paddleSpeed = Math.max(6, gameHeight * 0.02);
    if (waitingForServe) {
      ballX = Math.round((gameWidth - ballSize) / 2);
      ballY = Math.round((gameHeight - ballSize) / 2);
    }
    draw();
  });

  // ---- Mécaniques
  function clampPaddles() {
    const lim = gameHeight - paddleHeight;
    p1Y = Math.max(0, Math.min(p1Y, lim));
    p2Y = Math.max(0, Math.min(p2Y, lim));
  }

  function resetBall() {
    ballX = Math.round((gameWidth - ballSize) / 2);
    ballY = Math.round((gameHeight - ballSize) / 2);
    ballVX = 0; ballVY = 0;
    waitingForServe = true;
  }

  function serveBall() {
    const dir = Math.random() < 0.5 ? -1 : 1;
    ballVX = baseBallSpeed * dir;
    ballVY = (Math.random() * baseBallSpeed) - (baseBallSpeed / 2);
    waitingForServe = false;
  }

  function draw() {
    clampPaddles();
    paddle1.style.top = `${p1Y}px`;
    paddle2.style.top = `${p2Y}px`;
    ball.style.left = `${Math.round(ballX)}px`;
    ball.style.top  = `${Math.round(ballY)}px`;
    p1ScoreEl.textContent = String(s1).padStart(2, '0');
    p2ScoreEl.textContent = String(s2).padStart(2, '0');
  }

  // ---- Réseau helpers
  function sendState() {
    if (!ws || !wsConnected) return;
    const msg: WsMsgState = {
      type: 'state',
      room,
      payload: {
        ballX, ballY, p1Y, p2Y, s1, s2, waitingForServe, gamePaused,
        gameWidth, gameHeight, ballSize, paddleHeight
      }
    };
    ws.send(JSON.stringify(msg));
  }
  function sendInput() {
    if (!ws || !wsConnected) return;
    const up = !!keys['ArrowUp'];
    const down = !!keys['ArrowDown'];
    const msg: WsMsgInput = { type: 'input', room, up, down };
    ws.send(JSON.stringify(msg));
  }
  function sendServe() {
    if (!ws || !wsConnected) return;
    const msg: WsMsgServe = { type: 'serve', room };
    ws.send(JSON.stringify(msg));
  }

  // Le guest n’exécute pas la physique ; il envoie juste ses inputs périodiquement
  let inputTickAcc = 0;

  // Host : fréquence d’envoi d’état ~20Hz
  let netTickAcc = 0;

  // Boucle anim avec deltaTime
  let lastTime = performance.now();
  function loop(now: number) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (role === 'host') {
      // Host : gère la physique + peut jouer local (W/S et ↑/↓)
      if (!gamePaused) {
        // Paddles
        if (keys['w']) p1Y -= paddleSpeed;
        if (keys['s']) p1Y += paddleSpeed;

        // Si un guest est connecté, on privilégie ses inputs pour P2, sinon clavier local
        if (wsConnected) {
          // rien ici : le host mettra à jour p2Y à partir des flags reçus (voir ws.onmessage côté serveur)
          // Comme on n’a pas le serveur ici, on autorise aussi le local comme fallback:
          if (keys['ArrowUp']) p2Y -= paddleSpeed;
          if (keys['ArrowDown']) p2Y += paddleSpeed;
        } else {
          if (keys['ArrowUp']) p2Y -= paddleSpeed;
          if (keys['ArrowDown']) p2Y += paddleSpeed;
        }
        clampPaddles();

        // Balle
        if (!waitingForServe) {
          ballX += ballVX;
          ballY += ballVY;

          // murs
          if (ballY <= 0) { ballY = 0; ballVY = -ballVY; }
          else if (ballY + ballSize >= gameHeight) { ballY = gameHeight - ballSize; ballVY = -ballVY; }

          const p1L = paddle1.offsetLeft;
          const p1R = p1L + paddle1.offsetWidth;
          const p2L = paddle2.offsetLeft;
          const p2R = p2L + paddle2.offsetWidth;

          // collision P1
          if (ballX <= p1R && ballX + ballSize >= p1L && ballY + ballSize >= p1Y && ballY <= p1Y + paddleHeight) {
            ballX = p1R;
            ballVX = Math.abs(ballVX) * 1.05;
            const hit = ((ballY + ballSize/2) - (p1Y + paddleHeight/2)) / (paddleHeight/2);
            ballVY = hit * Math.max(3, Math.abs(ballVX));
          }
          // collision P2
          if (ballX + ballSize >= p2L && ballX <= p2R && ballY + ballSize >= p2Y && ballY <= p2Y + paddleHeight) {
            ballX = p2L - ballSize;
            ballVX = -Math.abs(ballVX) * 1.05;
            const hit = ((ballY + ballSize/2) - (p2Y + paddleHeight/2)) / (paddleHeight/2);
            ballVY = hit * Math.max(3, Math.abs(ballVX));
          }

          // score
          if (ballX < 0) { s2++; resetBall(); }
          else if (ballX > gameWidth) { s1++; resetBall(); }
        }
      }

      // Envoi d’état à 20Hz
      netTickAcc += dt;
      if (wsConnected && netTickAcc >= 0.05) {
        netTickAcc = 0;
        sendState();
      }

      draw();
    } else {
      // Guest : affiche l’état reçu et envoie ses inputs ~60Hz (limités par rafraîchissement)
      inputTickAcc += dt;
      if (wsConnected && inputTickAcc >= 1/60) {
        inputTickAcc = 0;
        sendInput();
      }

      // fallback si pas de WS: jouer en local au clavier partagé
      if (!wsConnected && !gamePaused) {
        if (keys['w']) p1Y -= paddleSpeed;
        if (keys['s']) p1Y += paddleSpeed;
        if (keys['ArrowUp']) p2Y -= paddleSpeed;
        if (keys['ArrowDown']) p2Y += paddleSpeed;
        clampPaddles();
        draw();
      }
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
