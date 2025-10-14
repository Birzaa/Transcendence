import { navigate } from "../main.js";
import { t, updateUI } from "../utils/i18n.js";

export function renderSoloGame(): void {
    document.getElementById('game-menu-container')?.remove();

    const app = document.getElementById('app');
    if (!app) return;

    const url = new URL(window.location.href);
	let playerName = url.searchParams.get("player1") || "Joueur 1";
	const color1 = url.searchParams.get("color1") || "bleu";
	const color2 = url.searchParams.get("color2") || "gris";
	const WIN_SCORE = parseInt(url.searchParams.get("score") || "5", 10);
    // Charge police pixel si absente
    if (!document.querySelector('link[href*="Press+Start+2P"]')) {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    }

    // HTML principal
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
                    ← Retour
                </button>

                <!-- Scores -->
                <div class="flex-1 flex justify-center items-center gap-4 pixel-font" style="font-size: 1.25rem;">
                    <div class="text-center">
                        <div class="text-purple-300 text-xs" data-i18n="Solo_Player">JOUEUR</div>
                        <span id="player-score" class="text-yellow-300">00</span>
                    </div>
                    <span class="text-white">:</span>
                    <div class="text-center">
                        <div class="text-pink-300 text-xs" data-i18n="Solo_Bot">BOT</div>
                        <span id="ai-score" class="text-yellow-300">00</span>
                    </div>
                </div>

                <button id="pause-btn" 
                    data-i18n="Solo_Pause"
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
                
                <img id="ball"
                     src="/images/ball.png"
                     class="absolute"
                     style="width: 30px; height: 30px;"
                     alt="ball">
                <img id="paddle"
                     src="/images/raquette_${color1}.png"
                     class="absolute left-4"
                     style="width: 22px; height: 96px;"
                     alt="paddle1">
                <img id="ai-paddle"
                     src="/images/raquette_${color2}.png"
                     class="absolute right-4"
                     style="width: 22px; height: 96px;"
                     alt="paddle2">

                <!-- Filet -->
                <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-300 transform -translate-x-1/2 
                            flex flex-col items-center justify-between py-2">
                    ${Array(8).fill('<div class="h-6 w-full bg-purple-400"></div>').join('')}
                </div>
            </div>

            <!-- Instructions clavier -->
            <div class="mt-4 text-center text-white text-sm pixel-font" data-i18n="Solo_Instructions">
                Flèches ↑ et ↓ pour déplacer votre raquette
            </div>
        </div>

        <img src="/images/logo.png" 
            class="fixed left-4 bottom-4 w-14 h-14 animate-float"
            alt="Chat kawaii">
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

    // Appliquer les traductions
    updateUI();

    initSoloGame(WIN_SCORE);
}

function initSoloGame(WIN_SCORE: number) {
    // scores
    let playerScore = 0;
    let aiScore = 0;

    // états du jeu
    let gamePaused = false;
    let waitingForServe = true;

    // éléments DOM
    const ball = document.getElementById('ball')!;
    const paddle = document.getElementById('paddle')!;
    const aiPaddle = document.getElementById('ai-paddle')!;
    const playerScoreDisplay = document.getElementById('player-score')!;
    const aiScoreDisplay = document.getElementById('ai-score')!;
    const pauseBtn = document.getElementById('pause-btn')!;
    const gameContainer = document.getElementById('game-container')!;

    // dimensions dynamiques
    let gameWidth = gameContainer.clientWidth;
    let gameHeight = gameContainer.clientHeight;
    let paddleHeight = paddle.offsetHeight;
    let ballSize = ball.offsetWidth;

    // positions
    let paddleY = (gameHeight - paddleHeight) / 2;
    let aiPaddleY = (gameHeight - paddleHeight) / 2;
    let ballX = (gameWidth - ballSize) / 2;
    let ballY = (gameHeight - ballSize) / 2;

    // vitesses
    let paddleSpeed = Math.max(6, gameHeight * 0.02);
    let ballSpeedX = 0;
    let ballSpeedY = 0;
    const baseBallSpeed = 4;

    // états des touches
    let upKeyPressed = false;
    let downKeyPressed = false;

    // IA - Simulation d'entrées clavier
    let aiUpKeyPressed = false;
    let aiDownKeyPressed = false;

    // IA - Snapshot du jeu (une fois par seconde)
    let lastAIUpdate = 0;
    let aiSnapshotBallX = ballX;
    let aiSnapshotBallY = ballY;
    let aiSnapshotBallSpeedX = ballSpeedX;
    let aiSnapshotBallSpeedY = ballSpeedY;
    let aiTargetY = aiPaddleY;
    let aiDecisionTime = 0; // Moment où la décision a été prise

    // IA - Difficulté et imperfection
    const AI_UPDATE_INTERVAL = 1000; // 1 seconde (contrainte du module)
    const AI_REACTION_ERROR = 0.30; // 30% d'erreur de prédiction (rend l'IA battable)
    const AI_DECISION_THRESHOLD = 25; // Seuil pour décider de bouger (zone morte plus large)
    const AI_REACTION_DELAY = 200; // Délai de réaction en ms (humanise l'IA)
    const AI_MISS_CHANCE = 0.12; // 12% de chance de rater complètement (erreur humaine)

    // IA - Prédire où la balle va arriver (avec rebonds)
    function predictBallPosition(): number {
        // Si la balle va vers le joueur (gauche), position défensive au centre
        if (aiSnapshotBallSpeedX <= 0) {
            return (gameHeight - paddleHeight) / 2;
        }

        // Simuler la trajectoire de la balle jusqu'à la raquette IA
        let simX = aiSnapshotBallX;
        let simY = aiSnapshotBallY;
        let simSpeedX = aiSnapshotBallSpeedX;
        let simSpeedY = aiSnapshotBallSpeedY;

        // Position X de la raquette IA (côté droit)
        const aiPaddleLeftEdge = aiPaddle.offsetLeft;
        const maxIterations = 1000;
        let iterations = 0;

        // Simuler jusqu'à ce que la balle atteigne la position X de la raquette IA
        while (simX + ballSize < aiPaddleLeftEdge && iterations < maxIterations) {
            simX += simSpeedX;
            simY += simSpeedY;

            // Rebonds sur les murs haut et bas
            if (simY <= 0) {
                simY = 0;
                simSpeedY = -simSpeedY;
            } else if (simY + ballSize >= gameHeight) {
                simY = gameHeight - ballSize;
                simSpeedY = -simSpeedY;
            }

            // Si la balle change de direction (collision avec paddle joueur), arrêter
            if (simX < 0) {
                return (gameHeight - paddleHeight) / 2; // Position centrale
            }

            iterations++;
        }

        // Ajouter une erreur de prédiction aléatoire pour rendre l'IA humaine
        const error = (Math.random() - 0.5) * gameHeight * AI_REACTION_ERROR;

        // La cible est le centre de la balle
        let predictedY = simY + (ballSize / 2) - (paddleHeight / 2) + error;

        // Garder la prédiction dans les limites
        predictedY = Math.max(0, Math.min(predictedY, gameHeight - paddleHeight));

        return predictedY;
    }

    // IA - Mettre à jour la décision de l'IA (une fois par seconde)
    function updateAIDecision(currentTime: number) {
        if (currentTime - lastAIUpdate >= AI_UPDATE_INTERVAL) {
            lastAIUpdate = currentTime;
            aiDecisionTime = currentTime; // Enregistrer le moment de la décision

            // Prendre un snapshot du jeu
            aiSnapshotBallX = ballX;
            aiSnapshotBallY = ballY;
            aiSnapshotBallSpeedX = ballSpeedX;
            aiSnapshotBallSpeedY = ballSpeedY;

            // Calculer la position cible avec prédiction
            // 12% de chance de rater complètement (erreur humaine)
            if (Math.random() < AI_MISS_CHANCE) {
                // L'IA rate et va au mauvais endroit
                aiTargetY = Math.random() * (gameHeight - paddleHeight);
            } else {
                aiTargetY = predictBallPosition();
            }
        }
    }

    // IA - Appliquer la décision après le délai de réaction
    function applyAIDecision(currentTime: number) {
        // Vérifier si le délai de réaction est passé depuis la dernière décision
        if (currentTime - aiDecisionTime < AI_REACTION_DELAY) {
            // Pas encore réagi → ne rien faire (touches désactivées)
            aiUpKeyPressed = false;
            aiDownKeyPressed = false;
            return;
        }

        // Le délai est passé → calculer la direction à prendre
        const centerY = aiPaddleY + paddleHeight / 2;
        const targetCenterY = aiTargetY + paddleHeight / 2;
        const diff = targetCenterY - centerY;

        // Réinitialiser les touches
        aiUpKeyPressed = false;
        aiDownKeyPressed = false;

        // Décider de bouger seulement si la différence est significative
        if (Math.abs(diff) > AI_DECISION_THRESHOLD) {
            if (diff < 0) {
                aiUpKeyPressed = true;
            } else {
                aiDownKeyPressed = true;
            }
        }
    }

    // mise à jour des dimensions (resize + init)
    function updateDimensions() {
        gameWidth = gameContainer.clientWidth;
        gameHeight = gameContainer.clientHeight;
        paddleHeight = paddle.offsetHeight || 96;
        ballSize = ball.offsetWidth || 30;
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

    function endGame(winner: string) {
        gamePaused = true;
        const overlay = document.createElement("div");
        overlay.className =
          "absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50";

        overlay.innerHTML = `
          <div class="relative max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300 text-center">
            <!-- Petit chat décoratif -->
            <img src="/images/logo.png" class="absolute -top-4 -right-4 w-12 h-12 rotate-12" alt="Petit chat">

            <!-- Barre violette -->
            <div class="bg-purple-600 text-pink-100 p-3">
              <h1 class="text-xl font-bold" data-i18n="Solo_GameResult">Résultat de la partie</h1>
            </div>

            <!-- Contenu -->
            <div class="p-6">
              <h2 class="pixel-font text-lg text-purple-700 mb-6">
                ☆ ${winner} <span data-i18n="Solo_Wins">gagne la partie !</span> ☆
              </h2>
              <button id="back-menu"
                data-i18n="Solo_BackToMenu"
                class="px-6 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                       text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                       active:shadow-none active:translate-y-[2px] active:border-purple-300 transition-all duration-100">
                ← Retour au menu
              </button>
            </div>
          </div>
        `;

        gameContainer.appendChild(overlay);
        updateUI(); // Appliquer les traductions sur le modal

        document.getElementById("back-menu")?.addEventListener("click", () => {
            navigate("/");
        });
    }

    function gameLoop() {
        if (!gamePaused) {
            const currentTime = Date.now();

            if (!waitingForServe) {
                // Mettre à jour la décision de l'IA (une fois par seconde)
                updateAIDecision(currentTime);
                // Appliquer la décision avec délai de réaction
                applyAIDecision(currentTime);
            }

            // paddle joueur → contrôlé par clavier
            if (upKeyPressed) paddleY = Math.max(paddleY - paddleSpeed, 0);
            if (downKeyPressed) paddleY = Math.min(paddleY + paddleSpeed, gameHeight - paddleHeight);

            // paddle IA → simulation d'entrées clavier (MÊME vitesse que le joueur)
            if (aiUpKeyPressed) aiPaddleY = Math.max(aiPaddleY - paddleSpeed, 0);
            if (aiDownKeyPressed) aiPaddleY = Math.min(aiPaddleY + paddleSpeed, gameHeight - paddleHeight);
        }

        if (!waitingForServe && !gamePaused) {
            ballX += ballSpeedX;
            ballY += ballSpeedY;

            // Collisions avec les murs haut et bas
            if (ballY <= 0) {
                ballY = 0;
                ballSpeedY = -ballSpeedY;
            } else if (ballY + ballSize >= gameHeight) {
                ballY = gameHeight - ballSize;
                ballSpeedY = -ballSpeedY;
            }

            // Positions des raquettes
            const paddleLeft = paddle.offsetLeft;
            const paddleRight = paddleLeft + paddle.offsetWidth;
            const aiPaddleLeft = aiPaddle.offsetLeft;
            const aiPaddleRight = aiPaddleLeft + aiPaddle.offsetWidth;

            // Collision avec la raquette gauche (joueur)
            if (
                ballX <= paddleRight &&
                ballX + ballSize >= paddleLeft &&
                ballY + ballSize >= paddleY &&
                ballY <= paddleY + paddleHeight
            ) {
                ballX = paddleRight;
                ballSpeedX = Math.abs(ballSpeedX) * 1.05;
                const hit = ((ballY + ballSize / 2) - (paddleY + paddleHeight / 2)) / (paddleHeight / 2);
                ballSpeedY = hit * Math.max(3, Math.abs(ballSpeedX));
            }

            // Collision avec la raquette droite (IA)
            if (
                ballX + ballSize >= aiPaddleLeft &&
                ballX <= aiPaddleRight &&
                ballY + ballSize >= aiPaddleY &&
                ballY <= aiPaddleY + paddleHeight
            ) {
                ballX = aiPaddleLeft - ballSize;
                ballSpeedX = -Math.abs(ballSpeedX) * 1.05;
                const hit = ((ballY + ballSize / 2) - (aiPaddleY + paddleHeight / 2)) / (paddleHeight / 2);
                ballSpeedY = hit * Math.max(3, Math.abs(ballSpeedX));
            }

            // Gestion des scores
            if (ballX < 0) {
                aiScore++;
                aiScoreDisplay.textContent = String(aiScore).padStart(2, '0');
                if (aiScore >= WIN_SCORE) endGame(t("Solo_Bot"));
                else resetBall();
            } else if (ballX > gameWidth - ballSize) {
                playerScore++;
                playerScoreDisplay.textContent = String(playerScore).padStart(2, '0');
                if (playerScore >= WIN_SCORE) endGame(t("Solo_Player"));
                else resetBall();
            }
        }

        drawPositions();
        requestAnimationFrame(gameLoop);
    }

    // gestion clavier
    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowUp') {
            upKeyPressed = true;
            if (waitingForServe) serveBall();
        }
        if (e.key === 'ArrowDown') {
            downKeyPressed = true;
            if (waitingForServe) serveBall();
        }
    }

    function handleKeyUp(e: KeyboardEvent) {
        if (e.key === 'ArrowUp') upKeyPressed = false;
        if (e.key === 'ArrowDown') downKeyPressed = false;
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

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