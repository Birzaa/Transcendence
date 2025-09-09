export function render1vs1() {
    document.getElementById('game-menu-container')?.remove();
    const app = document.getElementById('app');
    if (!app)
        return;
    // Vérifier si nous sommes en mode tournoi via les paramètres d'URL
    const url = new URL(window.location.href);
    const mode = url.searchParams.get("mode");
    let player1Name = url.searchParams.get("player1") || "Joueur 1";
    let player2Name = url.searchParams.get("player2") || "Joueur 2";
    // Si on est en mode tournoi, on utilise les noms des paramètres
    if (mode === "tournament") {
        player1Name = url.searchParams.get("player1") || "Joueur 1";
        player2Name = url.searchParams.get("player2") || "Joueur 2";
    }
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
                        <div class="text-purple-300 text-xs">${player1Name} (W/S)</div>
                        <span id="player1-score" class="text-yellow-300">00</span>
                    </div>
                    <span class="text-white">:</span>
                    <div class="text-center">
                        <div class="text-pink-300 text-xs">${player2Name} (↑/↓)</div>
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
    // Styles dynamiques
    const style = document.createElement('style');
    style.textContent = `
        .pixel-font { font-family: 'Press Start 2P', cursive; letter-spacing: 1px; }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .animate-float { animation: float 2s ease-in-out infinite; }
    `;
    document.head.appendChild(style);
    init1vs1Game();
}
function init1vs1Game() {
    // scores
    let player1Score = 0;
    let player2Score = 0;
    // états du jeu
    let gamePaused = false; // bouton Pause/Resume
    let waitingForServe = true; // vrai = la balle est au centre et n'avance pas
    // éléments DOM
    const ball = document.getElementById('ball');
    const paddle1 = document.getElementById('paddle1');
    const paddle2 = document.getElementById('paddle2');
    const player1ScoreDisplay = document.getElementById('player1-score');
    const player2ScoreDisplay = document.getElementById('player2-score');
    const pauseBtn = document.getElementById('pause-btn');
    const gameContainer = document.getElementById('game-container');
    // dimensions dynamiques
    let gameWidth = gameContainer.clientWidth;
    let gameHeight = gameContainer.clientHeight;
    let paddleHeight = paddle1.offsetHeight;
    let ballSize = ball.offsetWidth;
    // positions (px)
    let paddle1Y = (gameHeight - paddleHeight) / 2;
    let paddle2Y = (gameHeight - paddleHeight) / 2;
    let ballX = (gameWidth - ballSize) / 2;
    let ballY = (gameHeight - ballSize) / 2;
    // vitesses
    let paddleSpeed = Math.max(6, gameHeight * 0.02); // min 6px/frame pour petites tailles
    let ballSpeedX = 0;
    let ballSpeedY = 0;
    const baseBallSpeed = 4;
    const keys = {};
    // Recalcul des dimensions (à appeler au début et au resize)
    function updateDimensions() {
        gameWidth = gameContainer.clientWidth;
        gameHeight = gameContainer.clientHeight;
        paddleHeight = paddle1.offsetHeight || 80;
        ballSize = ball.offsetWidth || 5;
        paddleSpeed = Math.max(6, gameHeight * 0.02);
        // s'assurer que les raquettes restent dans les bornes après resize
        const limit = Math.max(0, gameHeight - paddleHeight);
        paddle1Y = Math.min(Math.max(0, paddle1Y), limit);
        paddle2Y = Math.min(Math.max(0, paddle2Y), limit);
    }
    // place la balle exactement au centre et attend le service
    function resetBall() {
        updateDimensions();
        ballX = Math.round((gameWidth - ballSize) / 2);
        ballY = Math.round((gameHeight - ballSize) / 2);
        ballSpeedX = 0;
        ballSpeedY = 0;
        waitingForServe = true;
        // Met à jour l'affichage immédiatement pour éviter tout décalage visuel
        drawPositions();
    }
    // lance la balle (appelé au premier mouvement d'un joueur)
    function serveBall() {
        updateDimensions();
        const dir = Math.random() < 0.5 ? -1 : 1;
        // on peut ajuster la vitesse selon la largeur si tu veux scaler
        const speed = baseBallSpeed;
        ballSpeedX = speed * dir;
        ballSpeedY = (Math.random() * speed) - (speed / 2);
        waitingForServe = false;
    }
    // dessine les positions sur le DOM
    function drawPositions() {
        // clamp des paddles pour éviter tout dépassement (sécurité)
        const limit = Math.max(0, gameHeight - paddleHeight);
        if (paddle1Y < 0)
            paddle1Y = 0;
        if (paddle1Y > limit)
            paddle1Y = limit;
        if (paddle2Y < 0)
            paddle2Y = 0;
        if (paddle2Y > limit)
            paddle2Y = limit;
        paddle1.style.top = `${paddle1Y}px`;
        paddle2.style.top = `${paddle2Y}px`;
        ball.style.left = `${Math.round(ballX)}px`;
        ball.style.top = `${Math.round(ballY)}px`;
    }
    // boucle principale (toujours en marche pour permettre de bouger les paddles
    // même pendant waitingForServe, mais la balle ne bouge que si !waitingForServe && !gamePaused)
    function gameLoop() {
        // Gestion des déplacements de raquettes (si pas en pause)
        if (!gamePaused) {
            if (keys['w'] && paddle1Y > 0)
                paddle1Y -= paddleSpeed;
            if (keys['s'] && paddle1Y < gameHeight - paddleHeight)
                paddle1Y += paddleSpeed;
            if (keys['ArrowUp'] && paddle2Y > 0)
                paddle2Y -= paddleSpeed;
            if (keys['ArrowDown'] && paddle2Y < gameHeight - paddleHeight)
                paddle2Y += paddleSpeed;
        }
        // Mouvement de la balle uniquement si le service a été fait et que le jeu n'est pas en pause
        if (!waitingForServe && !gamePaused) {
            ballX += ballSpeedX;
            ballY += ballSpeedY;
            // Collision haut/bas
            if (ballY <= 0) {
                ballY = 0;
                ballSpeedY = -ballSpeedY;
            }
            else if (ballY + ballSize >= gameHeight) {
                ballY = gameHeight - ballSize;
                ballSpeedY = -ballSpeedY;
            }
            // Récupère positions raquettes en pixels (relatif au conteneur)
            const p1Left = paddle1.offsetLeft;
            const p1Right = p1Left + paddle1.offsetWidth;
            const p2Left = paddle2.offsetLeft;
            const p2Right = p2Left + paddle2.offsetWidth;
            // Collision avec raquette gauche
            if (ballX <= p1Right &&
                ballX + ballSize >= p1Left &&
                ballY + ballSize >= paddle1Y &&
                ballY <= paddle1Y + paddleHeight) {
                // repositionner la balle hors de la raquette pour éviter sticky
                ballX = p1Right;
                // augmenter légèrement la vitesse X et renvoyer vers la droite
                ballSpeedX = Math.abs(ballSpeedX) * 1.05;
                // angle selon la position de la hitbox
                const hit = ((ballY + ballSize / 2) - (paddle1Y + paddleHeight / 2)) / (paddleHeight / 2);
                ballSpeedY = hit * Math.max(3, Math.abs(ballSpeedX));
            }
            // Collision avec raquette droite
            if (ballX + ballSize >= p2Left &&
                ballX <= p2Right &&
                ballY + ballSize >= paddle2Y &&
                ballY <= paddle2Y + paddleHeight) {
                ballX = p2Left - ballSize;
                ballSpeedX = -Math.abs(ballSpeedX) * 1.05;
                const hit = ((ballY + ballSize / 2) - (paddle2Y + paddleHeight / 2)) / (paddleHeight / 2);
                ballSpeedY = hit * Math.max(3, Math.abs(ballSpeedX));
            }
            // Gérer les scores
            if (ballX < 0) {
                player2Score++;
                player2ScoreDisplay.textContent = String(player2Score).padStart(2, '0');
                resetBall();
            }
            else if (ballX > gameWidth) {
                player1Score++;
                player1ScoreDisplay.textContent = String(player1Score).padStart(2, '0');
                resetBall();
            }
        }
        // mettre à jour DOM (raquettes + balle)
        drawPositions();
        // prochaine frame
        requestAnimationFrame(gameLoop);
    }
    // événements clavier
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        // si on attend le service, un mouvement lance la balle
        if (waitingForServe && ['w', 's', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            serveBall();
        }
        // si on était en pause, on laisse le bouton Pause gérer l'état (logique conservée)
        // mais on veut que les touches puissent aussi débloquer la partie si elle est en attente
    });
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    // pause / resume
    pauseBtn.addEventListener('click', () => {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
    });
    // resize
    window.addEventListener('resize', () => {
        updateDimensions();
        // recentre la balle visuellement si on est en attente
        if (waitingForServe) {
            ballX = Math.round((gameWidth - ballSize) / 2);
            ballY = Math.round((gameHeight - ballSize) / 2);
        }
        // redraw immédiat
        drawPositions();
    });
    // initialisation
    player1ScoreDisplay.textContent = String(player1Score).padStart(2, '0');
    player2ScoreDisplay.textContent = String(player2Score).padStart(2, '0');
    updateDimensions();
    resetBall();
    // lance la boucle d'animation (unique)
    requestAnimationFrame(gameLoop);
}
