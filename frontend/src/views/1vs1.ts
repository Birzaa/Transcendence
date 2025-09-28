import { navigate } from "../main.js";
import { renderTournamentWinner } from "./tournamentWinner.js";

export function render1vs1(): void {
  document.getElementById("game-menu-container")?.remove();

  const app = document.getElementById("app");
  if (!app) return;

  const url = new URL(window.location.href);
  const mode = url.searchParams.get("mode");
  let player1Name = url.searchParams.get("player1") || "Joueur 1";
  let player2Name = url.searchParams.get("player2") || "Joueur 2";

  if (mode === "tournament") {
    player1Name = url.searchParams.get("player1") || "Joueur 1";
    player2Name = url.searchParams.get("player2") || "Joueur 2";
  }

  if (!document.querySelector('link[href*="Press+Start+2P"]')) {
    const fontLink = document.createElement("link");
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
  }

  app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-fixed pt-[190px] pb-4">
      <div class="flex flex-col items-center mx-auto px-4" style="max-width: 800px;">
        <div class="flex justify-between items-center w-full mb-3 gap-2">
          <button onclick="window.navigate('/')" 
            class="flex-1 px-3 py-1 bg-purple-200 border-2 border-t-purple-400 border-l-purple-400 border-r-white border-b-white 
            text-purple-800 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
            active:border-t-white active:border-l-white active:border-r-purple-400 active:border-b-purple-400
            active:shadow-none active:translate-y-[2px] transition-all duration-100 text-center">
            ← Retour
          </button>

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

        <div class="relative w-full bg-purple-100 bg-opacity-30 border-2 border-purple-300" id="game-container" style="height: 400px;">

          <img id="ball"
               src="/images/ball.png"
               class="absolute"
               style="width: 30px; height: 30px;"
               alt="ball">
          <img id="paddle1"
               src="/images/raquette_bleu.png"
               class="absolute left-4"
               style="width: 22px; height: 96px;"
               alt="paddle1">
          <img id="paddle2"
               src="/images/raquette_rose.png"
               class="absolute right-4"
               style="width: 22px; height: 96px;"
               alt="paddle2">

          <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-purple-300 transform -translate-x-1/2 
                      flex flex-col items-center justify-between py-2">
            ${Array(8)
              .fill('<div class="h-6 w-full bg-purple-400"></div>')
              .join("")}
          </div>
        </div>
      </div>

      <img src="/images/logo.png" 
        class="fixed left-4 bottom-4 w-14 h-14 animate-float"
        alt="Chat kawaii">
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    .pixel-font { font-family: 'Press Start 2P', cursive; letter-spacing: 1px; }
    @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
    .animate-float { animation: float 2s ease-in-out infinite; }
  `;
  document.head.appendChild(style);

  init1vs1Game(player1Name, player2Name, mode);
}

function init1vs1Game(player1Name: string, player2Name: string, mode: string | null) {
  let player1Score = 0;
  let player2Score = 0;
  let gamePaused = false;
  let waitingForServe = true;

  const ball = document.getElementById("ball")!;
  const paddle1 = document.getElementById("paddle1")!;
  const paddle2 = document.getElementById("paddle2")!;
  const player1ScoreDisplay = document.getElementById("player1-score")!;
  const player2ScoreDisplay = document.getElementById("player2-score")!;
  const pauseBtn = document.getElementById("pause-btn")!;
  const gameContainer = document.getElementById("game-container")!;

  let gameWidth = gameContainer.clientWidth;
  let gameHeight = gameContainer.clientHeight;
  let paddleHeight = paddle1.offsetHeight;
  let ballSize = ball.offsetWidth;

  let paddle1Y = (gameHeight - paddleHeight) / 2;
  let paddle2Y = (gameHeight - paddleHeight) / 2;
  let ballX = (gameWidth - ballSize) / 2;
  let ballY = (gameHeight - ballSize) / 2;

  let paddleSpeed = Math.max(6, gameHeight * 0.02);
  let ballSpeedX = 0;
  let ballSpeedY = 0;
  const baseBallSpeed = 4;
  const WIN_SCORE = 5;

  const keys: { [key: string]: boolean } = {};

  function resetBall() {
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
    ballSpeedY = Math.random() * baseBallSpeed - baseBallSpeed / 2;
    waitingForServe = false;
  }

  function drawPositions() {
    paddle1.style.top = `${paddle1Y}px`;
    paddle2.style.top = `${paddle2Y}px`;
    ball.style.left = `${Math.round(ballX)}px`;
    ball.style.top = `${Math.round(ballY)}px`;
  }

  function showEndMatchScreen(winner: string) {
    const overlay = document.createElement("div");
    overlay.className =
      "absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50";
  
    overlay.innerHTML = `
      <div class="relative max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300 text-center">
        <!-- Petit chat décoratif -->
        <img src="/images/logo.png" class="absolute -top-4 -right-4 w-12 h-12 rotate-12" alt="Petit chat">
  
        <!-- Barre violette -->
        <div class="bg-purple-600 text-pink-100 p-3">
          <h1 class="text-xl font-bold">Résultat du match</h1>
        </div>
  
        <!-- Contenu -->
        <div class="p-6">
          <h2 class="pixel-font text-lg text-purple-700 mb-6">
            ☆ ${winner} gagne la partie ! ☆
          </h2>
          <button id="next-match"
            class="px-6 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                   text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                   active:shadow-none active:translate-y-[2px] active:border-purple-300 transition-all duration-100">
            ${mode === "tournament" ? "Partie suivante →" : "← Retour au menu"}
          </button>
        </div>
      </div>
    `;
  
    gameContainer.appendChild(overlay);
  
    document.getElementById("next-match")?.addEventListener("click", () => {
      if (mode === "tournament") {
        goToNextMatch(winner);
      } else {
        navigate("/");
      }
    });
  }
  
  

  function goToNextMatch(winner: string) {
    const matches = JSON.parse(localStorage.getItem("tournamentMatches") || "[]");
    let currentMatchIndex = parseInt(localStorage.getItem("currentTournamentMatch") || "0");
  
    matches[currentMatchIndex].winner = winner;
    localStorage.setItem("tournamentMatches", JSON.stringify(matches));
  
    const allDone = matches.every((m: any) => m.winner);
    
    // Si c'est la finale (dernier match du dernier tour)
    if (allDone && matches.length === 1) {
      renderTournamentWinner(winner);
      return;
    }
    
    if (allDone && matches.length > 1) {
      // Nouveau round
      const winners = matches.map((m: any) => m.winner);
      const newRound = [];
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) newRound.push({ p1: winners[i], p2: winners[i + 1] });
        else newRound.push({ p1: winners[i], p2: "— (qualifié d'office)" });
      }
      localStorage.setItem("tournamentMatches", JSON.stringify(newRound));
      localStorage.setItem("currentTournamentMatch", "0");
      
      // Si c'est la finale du nouveau round (il ne reste qu'un match)
      if (newRound.length === 1) {
        navigate(`/game?mode=tournament&player1=${encodeURIComponent(newRound[0].p1)}&player2=${encodeURIComponent(newRound[0].p2)}`);
      } else {
        navigate(`/game?mode=tournament&player1=${encodeURIComponent(newRound[0].p1)}&player2=${encodeURIComponent(newRound[0].p2)}`);
      }
    } else {
      currentMatchIndex++;
      localStorage.setItem("currentTournamentMatch", currentMatchIndex.toString());
      if (currentMatchIndex < matches.length) {
        const next = matches[currentMatchIndex];
        navigate(`/game?mode=tournament&player1=${encodeURIComponent(next.p1)}&player2=${encodeURIComponent(next.p2)}`);
      } else {
        // Si on arrive ici, c'est qu'on a terminé tous les matches d'un tour
        // Mais normalement ça ne devrait pas arriver car allDone devrait être true
        renderTournamentWinner(winner);
      }
    }
  }

  function endGame(winner: string) {
    gamePaused = true;
    showEndMatchScreen(winner);
  }

  function gameLoop() {
    if (!gamePaused) {
      if (keys["w"] && paddle1Y > 0) paddle1Y -= paddleSpeed;
      if (keys["s"] && paddle1Y < gameHeight - paddleHeight) paddle1Y += paddleSpeed;
      if (keys["ArrowUp"] && paddle2Y > 0) paddle2Y -= paddleSpeed;
      if (keys["ArrowDown"] && paddle2Y < gameHeight - paddleHeight) paddle2Y += paddleSpeed;
    }

    if (!waitingForServe && !gamePaused) {
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      if (ballY <= 0 || ballY + ballSize >= gameHeight) ballSpeedY = -ballSpeedY;

      const p1Right = paddle1.offsetLeft + paddle1.offsetWidth;
      const p2Left = paddle2.offsetLeft;

      if (ballX <= p1Right && ballY >= paddle1Y && ballY <= paddle1Y + paddleHeight) {
        ballSpeedX = Math.abs(ballSpeedX) * 1.05;
      }
      if (ballX + ballSize >= p2Left && ballY >= paddle2Y && ballY <= paddle2Y + paddleHeight) {
        ballSpeedX = -Math.abs(ballSpeedX) * 1.05;
      }

      if (ballX < 0) {
        player2Score++;
        player2ScoreDisplay.textContent = String(player2Score).padStart(2, "0");
        if (player2Score >= WIN_SCORE) endGame(player2Name);
        else resetBall();
      } else if (ballX > gameWidth) {
        player1Score++;
        player1ScoreDisplay.textContent = String(player1Score).padStart(2, "0");
        if (player1Score >= WIN_SCORE) endGame(player1Name);
        else resetBall();
      }
    }

    drawPositions();
    requestAnimationFrame(gameLoop);
  }

  document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (waitingForServe && ["w", "s", "ArrowUp", "ArrowDown"].includes(e.key)) serveBall();
  });
  document.addEventListener("keyup", (e) => (keys[e.key] = false));

  pauseBtn.addEventListener("click", () => {
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? "Resume" : "Pause";
  });

  resetBall();
  requestAnimationFrame(gameLoop);
}