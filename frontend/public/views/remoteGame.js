const WS_URL = (() => {
    const u = new URL(window.location.href);
    const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${u.host}/ws`;
})();
export function renderRemoteGame() {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId') || '';
    const role = params.get('role') || 'host';
    const app = document.getElementById('app');
    if (!app)
        return;
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-fixed pt-[190px] pb-4">
        <div class="flex flex-col items-center mx-auto px-4" style="max-width: 800px;">
            <!-- Barre de contrôle -->
            <div class="flex justify-between items-center w-full mb-3 gap-2">
                <button onclick="window.navigate('/')" 
                    class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
                        text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                        active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
                        active:shadow-none active:translate-y-[2px] transition-all durée-100 text-center">
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
                        active:shadow-none active:translate-y-[2px] transition-all durée-100">
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
    const gameContainer = document.getElementById('game-container');
    let gameWidth = gameContainer.clientWidth;
    let gameHeight = gameContainer.clientHeight;
    const paddleHeight = 80;
    const ballSize = 15;
    let p1Y = (gameHeight - paddleHeight) / 2;
    let p2Y = (gameHeight - paddleHeight) / 2;
    let ballX = (gameWidth - ballSize) / 2;
    let ballY = (gameHeight - ballSize) / 2;
    let ballVX = 0, ballVY = 0;
    let s1 = 0, s2 = 0;
    let waitingForServe = true;
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'set_username', username: role + Date.now(), isGame: true }));
    };
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'game_state' && role === 'guest') {
            ({ ballX, ballY, p1Y, p2Y, s1, s2, waitingForServe } = msg.state);
        }
    };
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    function serveBall() {
        const dir = Math.random() < 0.5 ? -1 : 1;
        ballVX = 4 * dir;
        ballVY = (Math.random() * 4) - 2;
        waitingForServe = false;
    }
    function sendState() {
        ws.send(JSON.stringify({
            type: 'game_state',
            roomId,
            state: { ballX, ballY, p1Y, p2Y, s1, s2, waitingForServe }
        }));
    }
    function loop() {
        if (role === 'host') {
            if (keys['w'])
                p1Y -= 6;
            if (keys['s'])
                p1Y += 6;
            if (keys['ArrowUp'])
                p2Y -= 6;
            if (keys['ArrowDown'])
                p2Y += 6;
            if (waitingForServe && (keys['w'] || keys['s'] || keys['ArrowUp'] || keys['ArrowDown'])) {
                serveBall();
            }
            if (!waitingForServe) {
                ballX += ballVX;
                ballY += ballVY;
                if (ballY <= 0 || ballY + ballSize >= gameHeight)
                    ballVY *= -1;
                if (ballX < 0) {
                    s2++;
                    waitingForServe = true;
                }
                if (ballX > gameWidth) {
                    s1++;
                    waitingForServe = true;
                }
            }
            sendState();
        }
        // --- Affichage ---
        document.getElementById('paddle1').style.top = `${p1Y}px`;
        document.getElementById('paddle2').style.top = `${p2Y}px`;
        document.getElementById('ball').style.left = `${ballX}px`;
        document.getElementById('ball').style.top = `${ballY}px`;
        document.getElementById('player1-score').textContent = s1.toString().padStart(2, '0');
        document.getElementById('player2-score').textContent = s2.toString().padStart(2, '0');
        requestAnimationFrame(loop);
    }
    loop();
}
