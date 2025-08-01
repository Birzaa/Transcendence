export function renderSoloGame(): void {
    // Supprime le menu existant
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

    // HTML principal
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-fixed pt-[190px] pb-4">
        <!-- Conteneur principal -->
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

                <!-- Scores (inchangé) -->
                <div class="flex-1 flex justify-center items-center gap-2 pixel-font text-yellow-300 text-shadow-pixel" style="font-size: 1.25rem;">
                    <span id="player-score">00</span>
                    <span class="text-white">:</span>
                    <span id="ai-score">00</span>
                </div>

                <button id="pause-btn" 
                    class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
                        text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                        active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
                        active:shadow-none active:translate-y-[2px] transition-all duration-100">
                    Pause
                </button>
            </div>

            <!-- Terrain de jeu -->
            <div class="relative w-full bg-purple-100 bg-opacity-30 border-2 border-purple-300" 
                id="game-container" 
                style="height: 400px;">
                
                <!-- Raquettes -->
                <div id="paddle" class="absolute w-3 h-20 bg-purple-400 left-4 top-1/2 transform -translate-y-1/2"></div>
                <div id="ai-paddle" class="absolute w-3 h-20 bg-pink-400 right-4 top-1/2 transform -translate-y-1/2"></div>
                
                <!-- Balle -->
                <div id="ball" class="absolute w-5 h-5 bg-yellow-300 rounded-full"></div>
                
                <!-- Filet -->
                <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-300 transform -translate-x-1/2 
                            flex flex-col items-center justify-between py-2">
                    ${Array(8).fill('<div class="h-6 w-full bg-purple-400"></div>').join('')}
                </div>
            </div>
        </div>

        <!-- Chat décoratif -->
        <img src="/images/logo.png" 
            class="fixed left-4 bottom-4 w-14 h-14 animate-float"
            alt="Chat kawaii">
    </div>
    `;

    // Styles dynamiques
    const style = document.createElement('style');
    style.textContent = `
        .pixel-font {
            font-family: 'Press Start 2P', cursive;
            letter-spacing: 1px;
        }
        .text-shadow-pixel {
            text-shadow: 2px 2px 0 #7e22ce;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
        }
        .animate-float {
            animation: float 2s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);

    // Initialisation du jeu
    initSoloGame();
}

function initSoloGame() {
    // Variables
    let playerScore = 0;
    let aiScore = 0;
    let gameRunning = true;
    let ballX = 400, ballY = 200;
    let ballSpeedX = 4, ballSpeedY = 4;
    let paddleY = 160;
    let aiPaddleY = 160;
    const paddleHeight = 80;
    const gameWidth = 800;
    const gameHeight = 400;

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

        // Mouvement balle
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Collisions
        if (ballY <= 0 || ballY >= gameHeight - 5) ballSpeedY = -ballSpeedY;

        if (ballX <= 30 && ballY > paddleY && ballY < paddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX * 1.05;
            playerScore++;
            playerScoreDisplay.textContent = String(playerScore).padStart(2, '0');
        }

        if (ballX >= gameWidth - 30 - 5 && ballY > aiPaddleY && ballY < aiPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        }

        // Scores
        if (ballX < 0 || ballX > gameWidth) {
            if (ballX < 0) aiScore++;
            else playerScore++;
            
            playerScoreDisplay.textContent = String(playerScore).padStart(2, '0');
            aiScoreDisplay.textContent = String(aiScore).padStart(2, '0');
            resetBall();
        }

        // IA
        aiPaddleY += (ballY - (aiPaddleY + paddleHeight/2)) * 0.07;

        // Mise à jour
        ball.style.left = `${ballX * (gameContainer.offsetWidth / gameWidth)}px`;
        ball.style.top = `${ballY}px`;
        updatePaddles();

        requestAnimationFrame(gameLoop);
    }

    function resetBall() {
        ballX = gameWidth / 2;
        ballY = gameHeight / 2;
        ballSpeedX = (ballSpeedX > 0 ? -4 : 4);
        ballSpeedY = (Math.random() * 6) - 3;
    }

    function updatePaddles() {
        paddle.style.top = `${paddleY}px`;
        aiPaddle.style.top = `${aiPaddleY}px`;
    }

    gameLoop();
}