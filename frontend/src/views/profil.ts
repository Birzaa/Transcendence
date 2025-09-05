import { navigate } from "../main.js";
import { fetchData } from "../tools/fetchData.js";
import { getOnlineUsers, subscribeToStatusUpdates } from "../main.js";

let statusUpdateUnsubscribe: ((msg: any) => void) | null = null;

function updateFriendStatusIndicators() {
  const usersOnline = getOnlineUsers();
  const friendsList = document.getElementById("friendsList");
  if (!friendsList) return;

  friendsList.querySelectorAll(".friend-item").forEach((friendEl) => {
    const friendName = friendEl.getAttribute("data-friend-name");
    if (!friendName) return;

    const statusDot = friendEl.querySelector(".status-dot") as HTMLElement;
    if (!statusDot) return;

    if (usersOnline.includes(friendName)) {
      statusDot.style.backgroundColor = "limegreen";
      statusDot.title = "En ligne";
    } else {
      statusDot.style.backgroundColor = "lightgray";
      statusDot.title = "Hors ligne";
    }
  });
}

export function initProfilSubscriptions() {
  // Désabonner l'ancien écouteur s'il existe
  if (statusUpdateUnsubscribe) {
    // Nous devons gérer cela différemment puisque subscribeToStatusUpdates
    // ne retourne pas de fonction de désabonnement
    console.log("Désabonnement de l'ancien écouteur de statut");
  }

  // Mettre à jour immédiatement les statuts
  updateFriendStatusIndicators();

  // S'abonner aux mises à jour
  subscribeToStatusUpdates((msg) => {
    if (msg.type === "user_list" || msg.type === "online_users") {
      updateFriendStatusIndicators();
      console.log("Utilisateurs en ligne mis à jour :", getOnlineUsers());
    }
  });
}

export async function renderProfil(playerName?: string): Promise<void> {
  let userId: string | undefined;
  let invalidUser = false;
  let avatarUrl: string | undefined;

  // Nettoyer les abonnements précédents
  if (statusUpdateUnsubscribe) {
    statusUpdateUnsubscribe = null;
  }

  if (playerName) {
    const res = await fetch(
      `/api/userIdByName?name=${encodeURIComponent(playerName)}`
    );
    if (res.ok) {
      const player = await res.json();
      userId = player.id;
      avatarUrl = player.avatar;
    } else {
      invalidUser = true;
    }
  } else {
    const res = await fetch("/api/me", { credentials: "include" });

    if (res.status === 401) {
      navigate("/auth");
      return;
    }
    const user = await res.json();
    userId = user.id;
    avatarUrl = user.avatar;
  }

  const app = document.getElementById("app")!;
  const title = invalidUser
    ? `${playerName} not found`
    : playerName
    ? `${playerName}'s game history`
    : `My game history`;

  app.innerHTML = `
    <!-- Fond principal -->
    <div class="min-h-screen mt-[128px] bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed flex">
      
      <!-- Sidebar -->
      <div class="w-1/6 h-screen fixed left-0 top-0 pt-[140px] px-4 bg-pink-50 bg-opacity-95 border-r-4 border-purple-300 shadow-xl flex flex-col justify-between">
        <div>
          <label for="playerName" class="mt-[75px] block text-purple-700 mb-2 text-lg font-semibold">🔍 Find a player</label>
          <input
            id="playerName"
            type="text"
            placeholder="Name's player..."
            class="w-full px-3 py-2 border-3 border-purple-300 bg-white text-purple-700 placeholder-purple-300 focus:outline-none focus:border-purple-400"
          />
          
          <!-- Liste des amis -->
          <div class="mt-6">
            <h2 class="text-purple-600 text-lg font-bold mb-2">💖 My Friends</h2>
            <div id="friendsList" class="max-h-48 overflow-y-auto bg-white p-2 border-3 border-purple-200 shadow-inner space-y-1 rounded-none">
              <!-- Amis chargés dynamiquement -->
            </div>
          </div>
        </div>
        
        <!-- Boutons -->
        <div class="flex flex-col gap-4 pb-6">
          <button id="btn-performance"
            class="relative px-4 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                   text-purple-800 font-bold text-lg
                   shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                   active:shadow-none active:translate-y-[2px] active:border-purple-300
                   transition-all duration-100">
            📈 Performances
          </button>

          <button id="btn-settings"
            class="relative px-4 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                   text-purple-800 font-bold text-lg
                   shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                   active:shadow-none active:translate-y-[2px] active:border-purple-300
                   transition-all duration-100">
            ⚙️ Settings
          </button>

          <button id="btn-deleteUser"
            class="relative px-4 py-2 bg-red-200 border-2 border-t-white border-l-white border-r-red-400 border-b-red-400 
                   text-red-800 font-bold text-lg
                   shadow-[2px_2px_0px_0px_rgba(239,68,68,0.3)]
                   active:shadow-none active:translate-y-[2px] active:border-red-300
                   transition-all duration-100">
            🗑️ Delete my account
          </button>
        </div>
      </div>

      <!-- History -->
      <div id="historyContainer" class="ml-[16.6667%] w-5/6 px-10 py-12">
        <div class=" bg-pink-100 bg-opacity-90 border-4 border-purple-300 shadow-lg p-6">
          <div class="bg-purple-600 text-pink-100 p-3 mb-6">
            <h1 class="text-2xl font-bold text-center">${title}</h1>
          </div>
        </div>
      </div>
    </div>
  `;

  if (!userId && !invalidUser) {
    console.error("UserId is undefined");
    return;
  }

  const historyContainer = document.getElementById("historyContainer")!;
  const friendsList = document.getElementById("friendsList")!;
  let alreadyFriend = false;

  const meRes = await fetch("/api/me", { credentials: "include" });
  if (meRes.status === 401) {
    navigate("/auth");
    return;
  }
  const me = await meRes.json();

  try {
    const res = await fetch(`/api/friends?userId=${me.id}`, {
      credentials: "include",
    });
    if (res.ok) {
      const friends = await res.json();
      if (friends.length === 0) {
        friendsList.innerHTML = `<p class="text-purple-400 text-sm">No friends yet.</p>`;
      } else {
        friendsList.innerHTML = "";
        for (const friend of friends) {
          const friendEl = document.createElement("div");
          friendEl.className =
            "friend-item flex justify-between items-center text-purple-700 px-3 py-1 border-3 border-purple-200 bg-pink-100 hover:bg-pink-200 cursor-pointer transition";

          friendEl.setAttribute("data-friend-name", friend.name);

          const statusDot = document.createElement("span");
          statusDot.className = "status-dot rounded-full w-3 h-3 inline-block mr-2";
          statusDot.style.backgroundColor = "lightgray";
          statusDot.title = "Hors ligne";

          const nameSpan = document.createElement("span");
          nameSpan.textContent = friend.name;
          nameSpan.style.flexGrow = "1";
          nameSpan.style.display = "flex";
          nameSpan.style.alignItems = "center";
          nameSpan.style.gap = "0.25rem";
          nameSpan.prepend(statusDot);
          nameSpan.onclick = () =>
            navigate(`/profil?player=${encodeURIComponent(friend.name)}`);

          friendEl.appendChild(nameSpan);

          const deleteBtn = document.createElement("span");
          deleteBtn.textContent = "❌";
          deleteBtn.title = `Remove ${friend.name}`;
          deleteBtn.style.cursor = "pointer";
          deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`Remove ${friend.name} from your friends?`)) {
              const res = await fetch("/api/removeFriend", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendName: friend.name }),
                credentials: "include",
              });
              if (res.ok) friendEl.remove();
              else alert("Error removing friend");
            }
          };
          friendEl.appendChild(deleteBtn);

          friendsList.appendChild(friendEl);

          if (playerName && friend.name === playerName) {
            alreadyFriend = true;
          }
        }
        // Mettre à jour les statuts immédiatement après le chargement des amis
        updateFriendStatusIndicators();
      }
    } else {
      friendsList.innerHTML = `<p class="text-red-400 text-sm">Error loading friends.</p>`;
    }
  } catch (err) {
    console.error("Erreur lors du chargement des amis:", err);
    friendsList.innerHTML = `<p class="text-red-400 text-sm">Error loading friends.</p>`;
  }

  if (playerName && !invalidUser && me.name !== playerName && !alreadyFriend) {
    const addFriendBtn = document.createElement("button");
    addFriendBtn.textContent = "➕ Add Friend";
    addFriendBtn.className =
      "relative px-6 py-2 bg-blue-200 border-2 border-t-white border-l-white border-r-blue-400 border-b-blue-400 \
       text-blue-900 font-bold shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)] \
       active:shadow-none active:translate-y-[2px] active:border-blue-300 transition-all duration-100 block mx-auto mb-6";
    addFriendBtn.onclick = async () => {
      const res = await fetch("/api/addFriend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendName: playerName }),
        credentials: "include",
      });
      if (!res.ok) alert("Error adding friend");
      renderProfil(playerName);
    };
    const h1 = historyContainer.querySelector("h1");
    if (h1) h1.after(addFriendBtn);
  }

  const gamesDiv = document.createElement("div");
  gamesDiv.id = "gamesHistory";
  gamesDiv.className = "flex flex-col gap-6";
  historyContainer.appendChild(gamesDiv);

  if (!invalidUser) {
    try {
      const gamesData = await fetchData("gamesHistory", userId!);
      if (!gamesData || gamesData.length === 0) {
        const div = document.createElement("div");
        div.className =
          "p-4 border-3 border-purple-200 bg-white rounded-none text-purple-600 shadow text-2xl text-center";
        div.textContent = "No games found...";
        gamesDiv.appendChild(div);
      } else {
        for (const game of gamesData) {
          const gameDiv = document.createElement("div");
          gameDiv.className = `
            p-6 border-3 border-purple-200 rounded-none shadow-lg hover:scale-105 transform transition
            bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 text-purple-800
          `;

          const minutes = Math.floor(game.duration / 60);
          const seconds = game.duration % 60;
          const durationStr = game.duration
            ? `${minutes}m${seconds.toString().padStart(2, "0")}s`
            : "Not played";

          const player1 = await fetchData("userNameById", game.player1_id);
          const player2 = await fetchData("userNameById", game.player2_id);

          const player1Name = player1?.name || `Deleted account`;
          const player1Avatar = player1?.avatar || "/avatar/default.png";

          const player2Name = player2?.name || `Deleted account`;
          const player2Avatar = player2?.avatar || "/avatar/default.png";

          let resultText!: string;
          let scoreClass!: string;

          if (game.winner_id === me.id) {
            resultText = "🌸 Victoire";
            scoreClass = "text-green-600";
          } else if (game.player1_score === game.player2_score) {
            resultText = "⚖️ Egalité";
            scoreClass = "text-yellow-600";
          } else {
            resultText = "💔 Défaite";
            scoreClass = "text-red-600";
          }

          gameDiv.innerHTML = `
            <div class="flex items-center gap-6 justify-center">
              <div class="flex flex-col items-center">
                <img src="${player1Avatar}" alt="Avatar 1" class="w-20 h-20 rounded-full border-4 border-purple-200 shadow-lg" />
                <span class="mt-2 font-semibold">${player1Name}</span>
              </div>

              <div class="flex flex-col items-center text-3xl font-bold ${scoreClass}">
                ${game.player1_score} - ${game.player2_score}
                <span class="text-sm font-normal mt-1">${resultText}</span>
              </div>

              <div class="flex flex-col items-center">
                <img src="${player2Avatar}" alt="Avatar 2" class="w-20 h-20 rounded-full border-4 border-purple-200 shadow-lg" />
                <span class="mt-2 font-semibold">${player2Name}</span>
              </div>
            </div>

            <p class="text-sm mt-4 text-center text-purple-700">
              Jouée le : <span class="font-semibold">${new Date(
                game.created_at
              ).toLocaleString()}</span><br/>
              Durée : <span class="font-semibold">${durationStr}</span>
            </p>
          `;
          gamesDiv.appendChild(gameDiv);
        }
      }
    } catch (err) {
      console.error("Erreur chargement parties:", err);
      const errorDiv = document.createElement("div");
      errorDiv.className = "text-red-500 text-center";
      errorDiv.textContent = "Error loading game history.";
      gamesDiv.appendChild(errorDiv);
    }
  }

  document.getElementById("btn-settings")!.onclick = () =>
    navigate("/settings");
  document.getElementById("btn-performance")!.onclick = () =>
    navigate("/performances");

  const playerNameInput = document.getElementById("playerName") as HTMLInputElement;
  playerNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const name = playerNameInput.value.trim();
      if (name) navigate(`/profil?player=${encodeURIComponent(name)}`);
    }
  });

  document.getElementById("btn-deleteUser")!.onclick = async () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action is irreversible."
      )
    ) {
      const res = await fetch("/deleteUser", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        navigate("/auth");
      } else {
        alert("Error deleting account");
      }
    }
  };

  // Initialiser les abonnements aux mises à jour de statut
  initProfilSubscriptions();
}