// chat.ts
import { renderProfil } from "../views/profil.js";
import { subscribeToStatusUpdates, getOnlineUsers, userState, navigate } from "../main.js";

const blockedUsers = new Set<string>(JSON.parse(localStorage.getItem('blockedUsers') || '[]'));
const hasSeenWelcome = new Set<string>(); // Pour éviter les messages de bienvenue en double

interface Message {
  from: string;
  content: string;
  type: 'message' | 'private_message';
  to?: string;
  timestamp?: number;
}

interface Channel {
  id: string;
  title: string;
  messages: Message[];
}

const channels = new Map<string, Channel>();
let currentChannelId = 'global';

// 🔹 Gestion du désabonnement
let chatStatusUnsubscribe: (() => void) | null = null;

async function isAuth(): Promise<boolean> {
  try {
    const res = await fetch('/api/me', { credentials: "include" });
    if (res.status === 401) {
      navigate('/auth');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erreur de vérification auth:', error);
    navigate('/auth');
    return false;
  }
}

export async function renderChat(): Promise<void> {
  const isAuthenticated = await isAuth();
  if (!isAuthenticated) return;

  const app = document.getElementById('app');
  if (!app) return;

  chatStatusUnsubscribe?.();
  chatStatusUnsubscribe = null;

  app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4 pt-[110px]">
      <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-6xl w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
          <div class="bg-purple-600 text-pink-100 p-3">
            <h1 class="text-xl font-bold text-center">Chat (=^･ω･^=)</h1>
          </div>

          <div class="flex h-[70vh]">
            <!-- Liste des utilisateurs -->
            <div class="w-1/4 bg-purple-100 p-4 overflow-y-auto border-r-2 border-purple-300">
              <h3 class="font-bold mb-2 text-purple-800">Utilisateurs connectés</h3>
              <ul id="users" class="space-y-2 text-sm"></ul>
            </div>

            <!-- Zone de chat principale -->
            <div class="flex-1 flex flex-col">
              <div id="channels-tabs" class="flex space-x-2 p-2 bg-purple-200 border-b-2 border-purple-300"></div>
              <div id="messages" class="flex-1 overflow-y-auto p-4 space-y-2 bg-violet-100"></div>
              <div class="p-4 border-t-2 border-purple-300 bg-purple-50">
                <div class="flex">
                  <textarea 
                    id="input" 
                    placeholder="Votre message..." 
                    class="flex-1 border-2 border-purple-300 px-3 py-2 bg-violet-100 resize-none" 
                    rows="3"
                  ></textarea>
                  <button 
                    id="send" 
                    class="ml-2 px-6 py-2 bg-purple-200 border-2 border-purple-400 text-purple-800 font-bold rounded"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  channels.clear();
  channels.set('global', { id: 'global', title: 'Global', messages: [] });
  currentChannelId = 'global';
  hasSeenWelcome.clear();

  setupEventListeners();
  renderChannelsTabs();
  renderMessages();

  chatStatusUnsubscribe = subscribeToStatusUpdates((msg) => {
    // console.log('Message reçu dans chat:', msg);

    if (msg.type === "user_list" || msg.type === "online_users") {
      renderUserList(msg.users, userState.currentUsername);
    } else if (msg.type === "message") {
      handleIncomingMessage(msg);
    } else if (msg.type === "private_message") {
      handleIncomingPrivateMessage(msg);
    }
  });

  renderUserList(getOnlineUsers(), userState.currentUsername);
}

function handleIncomingMessage(msg: any) {
  if (msg.from === 'Server' && msg.content === 'Bienvenue dans le chat !') {
    const welcomeKey = `${msg.from}-${msg.content}`;
    if (hasSeenWelcome.has(welcomeKey)) return;
    hasSeenWelcome.add(welcomeKey);
  }

  if (msg.from === userState.currentUsername) return;
  if (blockedUsers.has(msg.from)) return;

  const message: Message = {
    from: msg.from,
    content: msg.content,
    type: "message",
    timestamp: Date.now()
  };

  addMessageToChannel(message);
  if (currentChannelId === 'global') renderMessages();
  else renderChannelsTabs();
}

function handleIncomingPrivateMessage(msg: any) {
  if (msg.from === userState.currentUsername) return;
  if (blockedUsers.has(msg.from)) return;

  const message: Message = {
    from: msg.from,
    content: msg.content,
    type: "private_message",
    to: msg.to,
    timestamp: Date.now()
  };

  const channelId = msg.from;
  if (!channels.has(channelId)) {
    channels.set(channelId, { id: channelId, title: channelId, messages: [] });
    renderChannelsTabs();
  }

  addMessageToChannel(message);
  if (currentChannelId === channelId) renderMessages();
  else renderChannelsTabs();
}

function setupEventListeners() {
  const input = document.getElementById('input') as HTMLTextAreaElement;
  const sendButton = document.getElementById('send')!;
  sendButton.onclick = () => sendMessage();

  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
}

function sendMessage() {
  const input = document.getElementById('input') as HTMLTextAreaElement;
  const content = input.value.trim();
  if (!content) return;

  const socket: WebSocket | null = (window as any).debugSocket.getSocket();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert('WebSocket non connecté. Impossible d\'envoyer le message.');
    return;
  }

  try {
    const isGlobal = currentChannelId === 'global';
    const localMessage: Message = {
      type: isGlobal ? 'message' : 'private_message',
      from: userState.currentUsername,
      content,
      to: isGlobal ? undefined : currentChannelId,
      timestamp: Date.now()
    };

    // Ajout du message de l'utilisateur
    addMessageToChannel(localMessage);

    // Si c'est un DM et que le destinataire est hors ligne, ajouter un petit message "System" juste après
    if (!isGlobal) {
      const onlineUsers = getOnlineUsers();
      if (!onlineUsers.includes(currentChannelId)) {
        const systemMessage: Message = {
          type: 'private_message',
          from: 'System',
          content: `${currentChannelId} n'est plus sur le chat`,
          to: currentChannelId,
          timestamp: Date.now()
        };
        // On injecte ce message **dans le même canal**, donc pas de nouvel onglet
        channels.get(currentChannelId)?.messages.push(systemMessage);
      }
    }

    // Affiche les messages
    renderMessages();

    // Envoi au serveur
    socket.send(JSON.stringify({
      type: isGlobal ? 'message' : 'private_message',
      to: isGlobal ? undefined : currentChannelId,
      content
    }));

    input.value = '';
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    alert('Erreur lors de l\'envoi du message');
  }
}


function renderUserList(users: string[], currentUsername: string) {
  const usersContainer = document.getElementById('users')!;
  if (!usersContainer) return;
  usersContainer.innerHTML = '';

  users.forEach(user => {
    if (user === currentUsername) return;

    const isBlocked = blockedUsers.has(user);
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center p-2 hover:bg-purple-200 rounded';

    const userSpan = document.createElement('span');
    userSpan.textContent = user;
    userSpan.className = 'text-purple-600 hover:underline cursor-pointer';
    userSpan.onclick = () => renderProfil(user);

    const btnDM = document.createElement('button');
    btnDM.textContent = 'DM';
    btnDM.className = 'text-purple-800 hover:text-white hover:bg-purple-600 px-2 py-1 rounded border border-purple-400';
    btnDM.onclick = (e) => { e.stopPropagation(); openDM(user); };

    const btnBlock = document.createElement('button');
    btnBlock.textContent = isBlocked ? 'Débloquer' : 'Bloquer';
    btnBlock.className = isBlocked
      ? 'bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1 rounded border border-green-400'
      : 'bg-pink-100 text-pink-800 hover:bg-pink-200 px-2 py-1 rounded border border-pink-400';
    btnBlock.onclick = (e) => { e.stopPropagation(); (window as any).block(user); };

    li.appendChild(userSpan);
    li.appendChild(btnDM);
    li.appendChild(btnBlock);
    usersContainer.appendChild(li);
  });
}

function addMessageToChannel(message: Message) {
  let channelId: string;

  if (message.type === 'message') {
    channelId = 'global';
  } else {
    channelId = message.from === userState.currentUsername ? message.to! : message.from;
  }

  if (!channels.has(channelId)) {
    channels.set(channelId, { id: channelId, title: channelId, messages: [] });
  }

  const existingMessage = channels.get(channelId)!.messages.find(
    m => m.timestamp === message.timestamp && m.from === message.from && m.content === message.content
  );

  if (!existingMessage) {
    channels.get(channelId)!.messages.push(message);
    // console.log('Message ajouté au canal', channelId, ':', message);
  }
}

function renderChannelsTabs() {
  const tabsContainer = document.getElementById('channels-tabs')!;
  tabsContainer.innerHTML = '';

  channels.forEach((channel, id) => {
    const tab = document.createElement('div');
    tab.className = 'flex items-center cursor-pointer px-3 py-1 rounded ' +
      (id === currentChannelId ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800 hover:bg-purple-300');

    const titleSpan = document.createElement('span');
    titleSpan.textContent = channel.title;
    tab.appendChild(titleSpan);

    const unreadCount = channel.messages.filter(msg =>
      msg.from !== userState.currentUsername &&
      id !== currentChannelId
    ).length;

    if (unreadCount > 0) {
      const badge = document.createElement('span');
      badge.textContent = unreadCount.toString();
      badge.className = 'ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1';
      tab.appendChild(badge);
    }

    tab.onclick = () => {
      currentChannelId = id;
      renderChannelsTabs();
      renderMessages();
    };

    tabsContainer.appendChild(tab);
  });
}

function renderMessages() {
  const messagesContainer = document.getElementById('messages')!;
  messagesContainer.innerHTML = '';

  const channel = channels.get(currentChannelId);
  if (!channel) return;

  channel.messages.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex ' + (msg.from === userState.currentUsername ? 'justify-end' : 'justify-start') + ' my-2';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'max-w-[80%] p-3 rounded-lg ' +
      (msg.from === userState.currentUsername
        ? 'bg-baby-pink border-l-4 border-baby-pink-dark text-purple-700'
        : msg.from === 'System'
          ? 'bg-gray-200 border-l-4 border-gray-400 text-gray-700 italic'
          : 'bg-baby-blue border-l-4 border-darkest-blue text-purple-700');

    let fromText = msg.from === userState.currentUsername ? 'Vous' : msg.from;
    const fromSpan = document.createElement('span');
    fromSpan.className = 'font-bold text-purple-600';
    fromSpan.textContent = fromText;

    const textSpan = document.createElement('span');
    textSpan.textContent = ': ' + msg.content;

    contentDiv.appendChild(fromSpan);
    contentDiv.appendChild(textSpan);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function openDM(username: string) {
  if (blockedUsers.has(username)) {
    alert(`Vous avez bloqué ${username}. Débloquez-le pour lui envoyer un message.`);
    return;
  }

  if (!channels.has(username)) {
    channels.set(username, { id: username, title: username, messages: [] });
    renderChannelsTabs();
  }

  currentChannelId = username;
  renderMessages();
}

// Gestion du block
(window as any).block = (target: string) => {
  const socket: WebSocket | null = (window as any).debugSocket.getSocket();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert('WebSocket non connecté. Impossible de bloquer/débloquer.');
    return;
  }

  if (blockedUsers.has(target)) {
    if (confirm(`Voulez-vous débloquer ${target} ?`)) {
      blockedUsers.delete(target);
      localStorage.setItem('blockedUsers', JSON.stringify(Array.from(blockedUsers)));
      socket.send(JSON.stringify({ type: 'unblock', target }));
      renderUserList(getOnlineUsers(), userState.currentUsername);
    }
  } else {
    if (confirm(`Voulez-vous bloquer ${target} ?`)) {
      blockedUsers.add(target);
      localStorage.setItem('blockedUsers', JSON.stringify(Array.from(blockedUsers)));
      socket.send(JSON.stringify({ type: 'block', target }));
      renderUserList(getOnlineUsers(), userState.currentUsername);
    }
  }
};
