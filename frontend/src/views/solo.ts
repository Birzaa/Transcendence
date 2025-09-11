import { t } from "../utils/i18n.js"; // Import de la fonction de traduction

export function renderSoloGame(): void {
    document.getElementById('game-menu-container')?.remove();

    const app = document.getElementById('app');
    if (!app) return;

    // Charge police pixel si absente
    if (!document.querySelector('link[href*="Press+Start+2P"]')) {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    }

    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-fixed pt-[190px] pb-4">
        <div class="flex flex-col items-center mx-auto px-4" style="max-width: 800px;">
            <!-- Barre de contrôle -->
            <div class="flex justify-between items-center w-full mb-3 gap-2">
                <button onclick="window.navigate('/')" 
                    data-i18n="Solo_Back"
                    class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
                        text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                        active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
                        active:shadow-none active:translate-y-[2px] transition-all duration-100 text-center">
                    ${t("Solo_Back")}
                </button>

                <!-- Scores -->
                <div class="flex-1 flex justify-center items-center gap-4 pixel-font" style="font-size: 1.25rem;">
                    <div class="text-center">
                        <div class="text-purple-300 text-xs" data-i18n="Solo_Player">${t("Solo_Player")}</div>
                        <span id="player-score" class="text-yellow-300">00</span>
                    </div>
                    <span class="text-white">:</span>
                    <div class="text-center">
                        <div class="text-pink-300 text-xs" data-i18n="Solo_Bot">${t("Solo_Bot")}</div>
                        <span id="ai-score" class="text-yellow-300">00</span>
                    </div>
                </div>

                <button id="pause-btn" 
                    data-i18n="Solo_Pause"
                    class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
                        text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                        active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
                        active:shadow-none active:translate-y-[2px] transition-all duration-100">
                    ${t("Solo_Pause")}
                </button>
            </div>

            <!-- Terrain -->
            <div class="relative w-full bg-purple-100 bg-opacity-30 border-2 border-purple-300" 
                id="game-container" 
                style="height: 400px;">
                
                <div id="paddle" class="absolute w-3 h-20 bg-purple-400 left-4"></div>
                <div id="ai-paddle" class="absolute w-3 h-20 bg-pink-400 right-4"></div>
                <div id="ball" class="absolute w-5 h-5 bg-yellow-300 rounded-sm shadow-md"></div>

                <!-- Filet -->
                <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-300 transform -translate-x-1/2 
                            flex flex-col items-center justify-between py-2">
                    ${Array(8).fill('<div class="h-6 w-full bg-purple-400"></div>').join('')}
                </div>
            </div>

            <!-- Instructions clavier -->
            <div class="mt-4 text-center text-white text-sm pixel-font" data-i18n="Solo_Instructions">
                ${t("Solo_Instructions")}
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

    initSoloGame();
}

function initSoloGame() {
    let playerScore = 0;
    let aiScore = 0;
    let gamePaused = false;
    let waitingForServe = true;

    const ball = document.getElementById('ball')!;
    const paddle = document.getElementById('paddle')!;
    const aiPaddle = document.getElementById('ai-paddle')!;
    const playerScoreDisplay = document.getElementById('player-score')!;
    const aiScoreDisplay = document.getElementById('ai-score')!;
    const pauseBtn = document.getElementById('pause-btn')!;
    const gameContainer = document.getElementById('game-container')!;

    let gameWidth = gameContainer.clientWidth;
    let gameHeight = gameContainer.clientHeight;
    let paddleHeight = paddle.offsetHeight;
    let ballSize = ball.offsetWidth;

    let paddleY = (gameHeight - paddleHeight) / 2;
    let aiPaddleY = (gameHeight - paddleHeight) / 2;
    let ballX = (gameWidth - ballSize) / 2;
    let ballY = (gameHeight - ballSize) / 2;

    let paddleSpeed = Math.max(6, gameHeight * 0.02);
    let ballSpeedX = 0;
    let ballSpeedY = 0;
    const baseBallSpeed = 4;

    let upKeyPressed = false;
    let downKeyPressed = false;

    function updateDimensions() {
        gameWidth = gameContainer.clientWidth;
        gameHeight = gameContainer.clientHeight;
        paddleHeight = paddle.offsetHeight || 80;
        ballSize = ball.offsetWidth || 5;
        paddleSpeed = Math.max(6, gameHeight * 0.02);
    }

    function resetBall() {
        updateDimensions();
        ballX = (gameWidth - ballSize) / 2;
        ballY = (gameHeight - ballSize) / 2;
        ballSpeedX = 0;
        ballSpeedY = 0;
        waitingForServe = true;
        drawPositions();
    }

    function serveBall() {
        const dir = Math.random() < 0.5 ? -1 : 1;
        ballSpeedX = baseBallSpeed * dir;
        ballSpeedY = (Math.random() * baseBallSpeed) - (baseBallSpeed / 2);
        waitingForServe = false;
    }

    function drawPositions() {
        paddle.style.top = `${paddleY}px`;
        aiPaddle.style.top = `${aiPaddleY}px`;
        ball.style.left = `${Math.round(ballX)}px`;
        ball.style.top = `${Math.round(ballY)}px`;
    }

    function gameLoop() {
        if (!gamePaused) {
            if (upKeyPressed) paddleY = Math.max(paddleY - paddleSpeed, 0);
            if (downKeyPressed) paddleY = Math.min(paddleY + paddleSpeed, gameHeight - paddleHeight);

            const targetY = ballY - (paddleHeight / 2) + ballSize / 2;
            aiPaddleY += (targetY - aiPaddleY) * 0.07;
            aiPaddleY = Math.max(0, Math.min(aiPaddleY, gameHeight - paddleHeight));
        }

        if (!waitingForServe && !gamePaused) {
            ballX += ballSpeedX;
            ballY += ballSpeedY;

            if (ballY <= 0 || ballY + ballSize >= gameHeight) {
                ballSpeedY = -ballSpeedY;
                if (ballY <= 0) ballY = 0;
                if (ballY + ballSize >= gameHeight) ballY = gameHeight - ballSize;
            }

            // collisions raquettes
            if (
                ballX <= paddle.offsetLeft + paddle.offsetWidth &&
                ballY + ballSize >= paddleY &&
                ballY <= paddleY + paddleHeight
            ) {
                ballX = paddle.offsetLeft + paddle.offsetWidth;
                ballSpeedX = Math.abs(ballSpeedX) * 1.05;
                const hit = ((ballY + ballSize/2) - (paddleY + paddleHeight/2)) / (paddleHeight/2);
                ballSpeedY = hit * Math.max(3, Math.abs(ballSpeedX));
            }

            if (
                ballX + ballSize >= aiPaddle.offsetLeft &&
                ballY + ballSize >= aiPaddleY &&
                ballY <= aiPaddleY + paddleHeight
            ) {
                ballX = aiPaddle.offsetLeft - ballSize;
                ballSpeedX = -Math.abs(ballSpeedX) * 1.05;
                const hit = ((ballY + ballSize/2) - (aiPaddleY + paddleHeight/2)) / (paddleHeight/2);
                ballSpeedY = hit * Math.max(3, Math.abs(ballSpeedX));
            }

            // score
            if (ballX < 0) {
                aiScore++;
                aiScoreDisplay.textContent = String(aiScore).padStart(2, '0');
                resetBall();
            } else if (ballX > gameWidth) {
                playerScore++;
                playerScoreDisplay.textContent = String(playerScore).padStart(2, '0');
                resetBall();
            }
        }

        drawPositions();
        requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') upKeyPressed = true;
        if (e.key === 'ArrowDown') downKeyPressed = true;
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp') upKeyPressed = false;
        if (e.key === 'ArrowDown') downKeyPressed = false;
    });

    gameContainer.addEventListener('click', () => {
        if (waitingForServe) serveBall();
    });

    pauseBtn.addEventListener('click', () => {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? t("Solo_Resume") : t("Solo_Pause");
        pauseBtn.setAttribute("data-i18n", gamePaused ? "Solo_Resume" : "Solo_Pause");
    });

    window.addEventListener('resize', () => {
        updateDimensions();
        if (waitingForServe) resetBall();
        drawPositions();
    });

    updateDimensions();
    resetBall();
    playerScoreDisplay.textContent = '00';
    aiScoreDisplay.textContent = '00';
    requestAnimationFrame(gameLoop);
}







