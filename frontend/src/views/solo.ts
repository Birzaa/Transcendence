export function renderSoloGame(): void {
    document.getElementById('game-menu-container')?.remove();
    
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4 pt-20">
        <!-- Barre de contrôle -->
        <div class="flex justify-between items-center mb-4">
            <button onclick="window.navigate('/')" 
                class="px-4 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                      text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                      hover:bg-purple-300 transition-all duration-100">
                ← Retour
            </button>
            
            <!-- Scores pixelisés sans cadres -->
            <div class="flex items-center gap-2 pixel-font" style="font-size: 28px;">
                <div id="player-score" class="text-yellow-300 pixel-text">00</div>
                <div class="text-white mx-2">:</div>
                <div id="ai-score" class="text-yellow-300 pixel-text">00</div>
            </div>
            
            <button id="pause-btn" 
                class="px-4 py-2 bg-baby-blue border-2 border-darkest-blue 
                      text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                      hover:bg-purple-300 transition-all duration-100">
                Pause
            </button>
        </div>

        <!-- Terrain de jeu (identique à l'original) -->
        <div class="relative mx-auto border-2 border-purple-300 bg-purple-100 bg-opacity-30" 
             id="game-container" 
             style="width: 800px; height: 500px;">
             
            <div id="paddle" class="absolute w-4 h-24 bg-purple-400 left-4 top-1/2 transform -translate-y-1/2"></div>
            <div id="ai-paddle" class="absolute w-4 h-24 bg-pink-400 right-4 top-1/2 transform -translate-y-1/2"></div>
            <div id="ball" class="absolute w-6 h-6 bg-yellow-300 rounded-full shadow-md"></div>
            
            <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-300 transform -translate-x-1/2 
                        flex flex-col items-center">
                ${Array(10).fill('<div class="h-8 w-full bg-purple-300 my-2"></div>').join('')}
            </div>
        </div>

        <img src="/images/logo.png" 
             class="fixed left-4 bottom-4 w-16 h-16 animate-float"
             alt="Chat kawaii">
    </div>
    `;

    // Charge la police pixel
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // Style des scores
    const style = document.createElement('style');
    style.textContent = `
        .pixel-font {
            font-family: 'Press Start 2P', cursive;
            letter-spacing: 2px;
        }
        .pixel-text {
            text-shadow: 2px 2px 0 #7e22ce, 
                       -1px -1px 0 #7e22ce,
                       1px -1px 0 #7e22ce,
                       -1px 1px 0 #7e22ce;
            image-rendering: pixelated;
        }
    `;
    document.head.appendChild(style);

    initSoloGame();
}

function initSoloGame() {
    // Variables
    let playerScore = 0;
    let aiScore = 0;
    let gameRunning = true;
    let ballX = 400, ballY = 250;
    let ballSpeedX = 5, ballSpeedY = 5;
    let paddleY = 200;
    let aiPaddleY = 200;
    const paddleHeight = 96;
    const gameWidth = 800;
    const gameHeight = 500;

    // Éléments DOM
    const ball = document.getElementById('ball')!;
    const paddle = document.getElementById('paddle')!;
    const aiPaddle = document.getElementById('ai-paddle')!;
    const playerScoreDisplay = document.getElementById('player-score')!;
    const aiScoreDisplay = document.getElementById('ai-score')!;
    const pauseBtn = document.getElementById('pause-btn')!;
    const gameContainer = document.getElementById('game-container')!;

    // Contrôles
    gameContainer.addEventListener('mousemove', (e) => {
        if (!gameRunning) return;
        const rect = gameContainer.getBoundingClientRect();
        paddleY = Math.min(Math.max(e.clientY - rect.top - paddleHeight/2, 0), gameHeight - paddleHeight);
        updatePaddles();
    });

    pauseBtn.addEventListener('click', () => {
        gameRunning = !gameRunning;
        pauseBtn.textContent = gameRunning ? 'Pause' : 'Reprendre';
    });

    // Boucle de jeu
    function gameLoop() {
        if (!gameRunning) return requestAnimationFrame(gameLoop);

        // Physique
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Collisions
        if (ballY <= 0 || ballY >= gameHeight - 6) ballSpeedY = -ballSpeedY;

        if (ballX <= 30 && ballY > paddleY && ballY < paddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX * 1.05;
            playerScore++;
            playerScoreDisplay.textContent = String(playerScore).padStart(2, '0');
        }

        if (ballX >= gameWidth - 30 - 6 && ballY > aiPaddleY && ballY < aiPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        }

        // Scores
        if (ballX < 0) {
            aiScore++;
            aiScoreDisplay.textContent = String(aiScore).padStart(2, '0');
            resetBall();
        } else if (ballX > gameWidth) {
            playerScore++;
            playerScoreDisplay.textContent = String(playerScore).padStart(2, '0');
            resetBall();
        }

        // IA
        aiPaddleY += (ballY - (aiPaddleY + paddleHeight/2)) * 0.07;

        // Update positions
        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;
        updatePaddles();

        requestAnimationFrame(gameLoop);
    }

    function resetBall() {
        ballX = gameWidth / 2;
        ballY = gameHeight / 2;
        ballSpeedX = (ballSpeedX > 0 ? -5 : 5);
        ballSpeedY = (Math.random() * 6) - 3;
    }

    function updatePaddles() {
        paddle.style.top = `${paddleY}px`;
        aiPaddle.style.top = `${aiPaddleY}px`;
    }

    gameLoop();
}