export function render1vs1(): void {
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

    // HTML principal - Modifié pour afficher "Joueur 1" et "Joueur 2"
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

                <!-- Scores adaptés pour 2 joueurs -->
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

            <!-- Terrain de jeu -->
            <div class="relative w-full bg-purple-100 bg-opacity-30 border-2 border-purple-300" 
                id="game-container" 
                style="height: 400px;">
                
                <!-- Raquette Joueur 1 (gauche) -->
                <div id="paddle1" class="absolute w-3 h-20 bg-purple-400 left-4 top-1/2 transform -translate-y-1/2"></div>
                
                <!-- Raquette Joueur 2 (droite) -->
                <div id="paddle2" class="absolute w-3 h-20 bg-pink-400 right-4 top-1/2 transform -translate-y-1/2"></div>
                
                <!-- Balle -->
                <div id="ball" class="absolute w-5 h-5 bg-yellow-300 rounded-full"></div>
                
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

    // Styles dynamiques (inchangés)
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

    init1vs1Game();
}

function init1vs1Game() {
    // Variables
    let player1Score = 0;
    let player2Score = 0;
    let gameRunning = true;
    let ballX = 400, ballY = 200;
    let ballSpeedX = 4, ballSpeedY = 4;
    let paddle1Y = 160, paddle2Y = 160;
    const paddleHeight = 80;
    const gameWidth = 800;
    const gameHeight = 400;
    const paddleSpeed = 8;

    // Éléments DOM
    const ball = document.getElementById('ball')!;
    const paddle1 = document.getElementById('paddle1')!;
    const paddle2 = document.getElementById('paddle2')!;
    const player1ScoreDisplay = document.getElementById('player1-score')!;
    const player2ScoreDisplay = document.getElementById('player2-score')!;
    const pauseBtn = document.getElementById('pause-btn')!;
    const gameContainer = document.getElementById('game-container')!;

    // États des touches
    const keys: { [key: string]: boolean } = {};

    // Détection des touches
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);

    pauseBtn.addEventListener('click', () => {
        gameRunning = !gameRunning;
        pauseBtn.textContent = gameRunning ? 'Pause' : 'Reprendre';
    });

    // Boucle de jeu optimisée
    function gameLoop() {
        if (!gameRunning) return requestAnimationFrame(gameLoop);

        // Mouvement des raquettes
        if (keys['w'] && paddle1Y > 0) paddle1Y -= paddleSpeed;
        if (keys['s'] && paddle1Y < gameHeight - paddleHeight) paddle1Y += paddleSpeed;
        if (keys['ArrowUp'] && paddle2Y > 0) paddle2Y -= paddleSpeed;
        if (keys['ArrowDown'] && paddle2Y < gameHeight - paddleHeight) paddle2Y += paddleSpeed;

        // Mouvement balle
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Collisions avec les murs (haut/bas)
        if (ballY <= 0 || ballY >= gameHeight - 5) {
            ballSpeedY = -ballSpeedY;
            ballY = Math.max(5, Math.min(ballY, gameHeight - 5)); // Corrige la position
        }

        // Collision raquette gauche (Joueur 1)
        if (ballX <= 30 && ballX >= 20 && 
            ballY + 5 >= paddle1Y && ballY <= paddle1Y + paddleHeight) {
            ballSpeedX = Math.abs(ballSpeedX) * 1.05; // Garantit un mouvement vers la droite
            const hitPosition = (ballY - (paddle1Y + paddleHeight/2)) / (paddleHeight/2);
            ballSpeedY = hitPosition * 6; // Effet de direction
        }

        // Collision raquette droite (Joueur 2)
        if (ballX >= gameWidth - 30 - 5 && ballX <= gameWidth - 20 && 
            ballY + 5 >= paddle2Y && ballY <= paddle2Y + paddleHeight) {
            ballSpeedX = -Math.abs(ballSpeedX) * 1.05; // Garantit un mouvement vers la gauche
            const hitPosition = (ballY - (paddle2Y + paddleHeight/2)) / (paddleHeight/2);
            ballSpeedY = hitPosition * 6; // Effet de direction
        }

        // Gestion des scores
        if (ballX < 0) {
            player2Score++;
            player2ScoreDisplay.textContent = String(player2Score).padStart(2, '0');
            resetBall();
        } else if (ballX > gameWidth) {
            player1Score++;
            player1ScoreDisplay.textContent = String(player1Score).padStart(2, '0');
            resetBall();
        }

        // Mise à jour des positions
        ball.style.left = `${(ballX / gameWidth) * 100}%`;
        ball.style.top = `${ballY}px`;
        paddle1.style.top = `${paddle1Y}px`;
        paddle2.style.top = `${paddle2Y}px`;

        requestAnimationFrame(gameLoop);
    }

    function resetBall() {
        ballX = gameWidth / 2;
        ballY = gameHeight / 2;
        ballSpeedX = (Math.random() > 0.5 ? 4 : -4);
        ballSpeedY = (Math.random() * 4) - 2;
        
        gameRunning = false;
        setTimeout(() => gameRunning = true, 1000);
    }

    gameLoop();
}