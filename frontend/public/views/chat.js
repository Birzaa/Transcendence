import { renderProfil } from "../views/profil.js";
let socket = null;
const blockedUsers = new Set(JSON.parse(localStorage.getItem('blockedUsers') || '[]'));
const channels = new Map();
let currentChannelId = 'global';
export function renderChat() {
    const app = document.getElementById('app');
    if (!app)
        return;
    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4 pt-[110px]">
      <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-6xl w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
          <!-- Barre violette avec titre -->
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
              <!-- Onglets des canaux -->
              <div id="channels-tabs" class="flex space-x-2 p-2 bg-purple-200 border-b-2 border-purple-300"></div>
              
              <!-- Messages -->
              <div id="messages" class="flex-1 overflow-y-auto p-4 space-y-2 bg-violet-100"></div>
            
              <!-- Zone de saisie -->
              <div class="p-4 border-t-2 border-purple-300 bg-purple-50">
                <div class="flex">
                  <textarea 
                    id="input" 
                    placeholder="Votre message..." 
                    class="flex-1 border-2 border-purple-300 px-3 py-2 rounded-none bg-violet-100 focus:border-purple-400 resize-none" 
                    rows="3"
                  ></textarea>
                  <button 
                    id="send" 
                    class="ml-2 relative px-6 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                          text-purple-800 font-bold
                          shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                          active:shadow-none active:translate-y-[2px] active:border-purple-300
                          transition-all duration-100"
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
    initChatWebSocket();
    setupEventListeners();
    renderChannelsTabs();
    renderMessages();
}
function setupEventListeners() {
    const input = document.getElementById('input');
    const sendButton = document.getElementById('send');
    sendButton.onclick = () => sendMessage();
    input.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
}
function sendMessage() {
    const input = document.getElementById('input');
    const content = input.value.trim();
    if (!content || !socket || socket.readyState !== WebSocket.OPEN)
        return;
    if (currentChannelId !== 'global' && blockedUsers.has(currentChannelId)) {
        alert(`Vous avez bloqué ${currentChannelId}. Débloquez-le pour lui envoyer un message.`);
        return;
    }
    if (currentChannelId === 'global') {
        socket.send(JSON.stringify({ type: 'message', content }));
    }
    else {
        socket.send(JSON.stringify({ type: 'private_message', to: currentChannelId, content }));
        addMessageToChannel({
            type: 'private_message',
            from: 'Moi',
            content,
            to: currentChannelId,
        });
        renderMessages();
    }
    input.value = '';
}
async function initChatWebSocket() {
    let username = 'Inconnu';
    try {
        const res = await fetch('/api/me');
        if (res.ok) {
            const data = await res.json();
            username = data.name;
        }
    }
    catch { }
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
    }
    socket = new WebSocket('ws://localhost:3001/ws');
    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'set_username', username }));
    };
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'user_list') {
            renderUserList(data.users, username);
        }
        if (data.type === 'message') {
            if (data.from !== username && blockedUsers.has(data.from))
                return;
            addMessageToChannel({ type: 'message', from: data.from, content: data.content });
            if (currentChannelId === 'global')
                renderMessages();
            else
                renderChannelsTabs();
        }
        if (data.type === 'private_message') {
            if (data.from !== username && blockedUsers.has(data.from))
                return;
            if (!channels.has(data.from)) {
                channels.set(data.from, { id: data.from, title: data.from, messages: [] });
                renderChannelsTabs();
            }
            addMessageToChannel({ type: 'private_message', from: data.from, content: data.content, to: username });
            if (currentChannelId === data.from)
                renderMessages();
            else
                renderChannelsTabs();
        }
    };
}
function renderUserList(users, currentUsername) {
    const usersContainer = document.getElementById('users');
    if (!usersContainer)
        return;
    usersContainer.innerHTML = '';
    users.forEach(user => {
        if (user === currentUsername)
            return;
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
        btnDM.onclick = (e) => {
            e.stopPropagation();
            openDM(user);
        };
        const btnBlock = document.createElement('button');
        btnBlock.textContent = isBlocked ? 'Débloquer' : 'Bloquer';
        btnBlock.className = isBlocked
            ? 'bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1 rounded border border-green-400'
            : 'bg-pink-100 text-pink-800 hover:bg-pink-200 px-2 py-1 rounded border border-pink-400';
        btnBlock.onclick = (e) => {
            e.stopPropagation();
            window.block(user);
        };
        li.appendChild(userSpan);
        li.appendChild(btnDM);
        li.appendChild(btnBlock);
        usersContainer.appendChild(li);
    });
}
function addMessageToChannel(message) {
    const channelId = message.type === 'message' ? 'global' : (message.from === 'Moi' ? message.to : message.from);
    if (!channels.has(channelId)) {
        channels.set(channelId, { id: channelId, title: channelId, messages: [] });
    }
    channels.get(channelId).messages.push(message);
}
function renderChannelsTabs() {
    const tabsContainer = document.getElementById('channels-tabs');
    tabsContainer.innerHTML = '';
    channels.forEach((channel, id) => {
        const tab = document.createElement('div');
        tab.textContent = channel.title;
        tab.className = 'cursor-pointer px-3 py-1 rounded ' +
            (id === currentChannelId
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-800 hover:bg-purple-300');
        const unread = channel.messages.some(msg => msg.from !== 'Moi' && id !== currentChannelId);
        if (unread) {
            const notif = document.createElement('span');
            notif.textContent = ' •';
            notif.className = 'text-red-600 font-bold';
            tab.appendChild(notif);
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
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';
    const channel = channels.get(currentChannelId);
    if (!channel)
        return;
    channel.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        // Message du serveur
        if (msg.from === 'Server') {
            messageDiv.className = 'flex justify-center my-2';
            const serverMsg = document.createElement('div');
            serverMsg.className = 'bg-baby-pink border-l-4 border-baby-pink-dark text-purple-800 p-3 rounded-none';
            serverMsg.innerHTML = `
        <div class="font-bold">
          <span class="text-purple-300">☆</span> ${msg.from}
        </div>
        <div class="italic">${msg.content}</div>
      `;
            messageDiv.appendChild(serverMsg);
            messagesContainer.appendChild(messageDiv);
            return;
        }
        // Messages normaux
        messageDiv.className = 'flex ' + (msg.from === 'Moi' ? 'justify-end' : 'justify-start') + ' my-2';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'max-w-[80%] p-3 rounded-lg ' +
            (msg.from === 'Moi'
                ? 'bg-baby-pink border-l-4 border-baby-pink-dark text-purple-700 p-3 rounded-none'
                : 'bg-baby-blue border-l-4 border-darkest-blue text-purple-700 p-3 rounded-none');
        let fromText = msg.from;
        if (msg.from === 'Moi')
            fromText = 'Vous';
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
function openDM(username) {
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
function updateBlockButton(username, blocked) {
    const usersContainer = document.getElementById('users');
    if (!usersContainer)
        return;
    const listItems = usersContainer.querySelectorAll('li');
    listItems.forEach(li => {
        const userSpan = li.querySelector('span.text-purple-600');
        if (userSpan && userSpan.textContent === username) {
            const btn = li.querySelector('button.bg-red-100, button.bg-green-100');
            if (btn) {
                btn.textContent = blocked ? 'Débloquer' : 'Bloquer';
                btn.className = blocked
                    ? 'bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1 rounded border border-green-400'
                    : 'bg-red-100 text-red-800 hover:bg-red-200 px-2 py-1 rounded border border-red-400';
            }
        }
    });
}
window.block = (target) => {
    if (blockedUsers.has(target)) {
        if (confirm(`Voulez-vous débloquer ${target} ?`)) {
            blockedUsers.delete(target);
            localStorage.setItem('blockedUsers', JSON.stringify(Array.from(blockedUsers)));
            socket.send(JSON.stringify({ type: 'unblock', target }));
            updateBlockButton(target, false);
        }
    }
    else {
        if (confirm(`Voulez-vous bloquer ${target} ?`)) {
            blockedUsers.add(target);
            localStorage.setItem('blockedUsers', JSON.stringify(Array.from(blockedUsers)));
            socket.send(JSON.stringify({ type: 'block', target }));
            updateBlockButton(target, true);
        }
    }
};
