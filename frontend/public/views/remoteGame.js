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
    app.innerHTML = `<div id="gameContainer" class="w-full h-screen bg-gray-900 relative"></div>`;
    const gameContainer = document.getElementById('gameContainer');
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
    let gamePaused = false;
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'set_username', username: role + Date.now() }));
        if (role === 'host') {
            ws.send(JSON.stringify({ type: 'create_room', username: 'host' }));
        }
        else {
            ws.send(JSON.stringify({ type: 'join_room', roomId, username: 'guest' }));
        }
    };
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'state' && role === 'guest') {
            ({ ballX, ballY, p1Y, p2Y, s1, s2, waitingForServe, gamePaused } = msg.payload);
        }
        if (msg.type === 'input' && role === 'host') {
            if (msg.input.up)
                p2Y -= 6;
            if (msg.input.down)
                p2Y += 6;
        }
        if (msg.type === 'serve') {
            serveBall();
        }
    };
    const keys = {};
    document.addEventListener('keydown', e => {
        keys[e.key] = true;
        if (role === 'host' && waitingForServe && ['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            serveBall();
            ws.send(JSON.stringify({ type: 'serve', roomId }));
        }
    });
    document.addEventListener('keyup', e => { keys[e.key] = false; });
    function serveBall() {
        const dir = Math.random() < 0.5 ? -1 : 1;
        ballVX = 4 * dir;
        ballVY = (Math.random() * 4) - 2;
        waitingForServe = false;
    }
    function sendState() {
        ws.send(JSON.stringify({
            type: 'state',
            roomId,
            payload: { ballX, ballY, p1Y, p2Y, s1, s2, waitingForServe, gamePaused }
        }));
    }
    function sendInput() {
        ws.send(JSON.stringify({
            type: 'input',
            roomId,
            up: keys['ArrowUp'],
            down: keys['ArrowDown']
        }));
    }
    function loop() {
        if (role === 'host') {
            if (keys['w'])
                p1Y -= 6;
            if (keys['s'])
                p1Y += 6;
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
        else {
            sendInput();
        }
        requestAnimationFrame(loop);
    }
    loop();
}
