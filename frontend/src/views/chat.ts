import { renderProfil } from "../views/profil.js";

let socket: WebSocket | null = null;
const blockedUsers = new Set<string>(JSON.parse(localStorage.getItem('blockedUsers') || '[]'));

interface Message {
  from: string;
  content: string;
  type: 'message' | 'private_message';
  to?: string;
}

interface Channel {
  id: string;
  title: string;
  messages: Message[];
}

const channels = new Map<string, Channel>();
let currentChannelId = 'global';

export function renderChat(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="flex h-[80vh] max-w-4xl mx-auto mt-[168px] bg-white rounded shadow overflow-hidden">
      <div class="w-1/4 bg-gray-100 p-4 overflow-y-auto" id="user-list">
        <h3 class="font-bold mb-2">Utilisateurs connectés</h3>
        <ul id="users" class="space-y-2 text-sm"></ul>
      </div>

      <div class="flex-1 flex flex-col p-4">
        <div id="channels-tabs" class="flex space-x-2 mb-2 border-b"></div>
        <div id="messages" class="flex-1 overflow-y-auto border rounded p-2 mb-2 space-y-1 bg-gray-50"></div>
        <div class="flex mt-2">
          <textarea id="input" placeholder="Votre message..." class="flex-1 border rounded p-2 mr-2 resize-none" rows="3"></textarea>
          <button id="send" class="bg-blue-500 text-white px-4 py-2 rounded">Envoyer</button>
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
  if (!content || !socket || socket.readyState !== WebSocket.OPEN) return;

   if (currentChannelId !== 'global' && blockedUsers.has(currentChannelId)) {
    alert(`Vous avez bloqué ${currentChannelId}. Débloquez-le pour lui envoyer un message.`);
    return;
  }
  
  if (currentChannelId === 'global') {
    socket.send(JSON.stringify({ type: 'message', content }));
  } else {
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

async function initChatWebSocket(): Promise<void> {
  let username = 'WhoAreU?';

  try {
    const res = await fetch('/api/me');
    if (res.ok) {
      const data = await res.json();
      username = data.name;
    }
  } catch {}

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    socket.close();
  }

  socket = new WebSocket('ws://localhost:3001/ws');

  socket.onopen = () => {
    socket!.send(JSON.stringify({ type: 'set_username', username }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'user_list') {
      renderUserList(data.users, username);
    }

    if (data.type === 'message') {
      if (data.from !== username && blockedUsers.has(data.from)) return;

      addMessageToChannel({ type: 'message', from: data.from, content: data.content });
      if (currentChannelId === 'global') renderMessages();
      else renderChannelsTabs();
    }

    if (data.type === 'private_message') {
      if (data.from !== username && blockedUsers.has(data.from)) return;

      if (!channels.has(data.from)) {
        channels.set(data.from, { id: data.from, title: data.from, messages: [] });
        renderChannelsTabs();
      }

      addMessageToChannel({ type: 'private_message', from: data.from, content: data.content, to: username });
      if (currentChannelId === data.from) renderMessages();
      else renderChannelsTabs();
    }
  };
}

function renderUserList(users: string[], currentUsername: string) {
  const usersContainer = document.getElementById('users')!;
  usersContainer.innerHTML = '';

  users.forEach(user => {
    if (user === currentUsername) return;

    const isBlocked = blockedUsers.has(user);

    const li = document.createElement('li');
    li.className = 'flex justify-between items-center';

    const userSpan = document.createElement('span');
    userSpan.textContent = user;
    userSpan.className = 'text-blue-600 hover:underline cursor-pointer';
    userSpan.onclick = () => renderProfil(user);

    const btnInvite = document.createElement('button');
    btnInvite.textContent = 'Inviter';
    btnInvite.className = 'text-blue-500 hover:underline';
    btnInvite.onclick = () => invite(user);

    const btnDM = document.createElement('button');
    btnDM.textContent = 'DM';
    btnDM.className = 'text-purple-500 hover:underline cursor-pointer';
    btnDM.onclick = () => openDM(user);

    const btnBlock = document.createElement('button');
    btnBlock.textContent = isBlocked ? 'Débloquer' : 'Bloquer';
    btnBlock.className = isBlocked
      ? 'text-green-500 hover:underline cursor-pointer'
      : 'text-red-500 hover:underline cursor-pointer';
    btnBlock.onclick = () => (window as any).block(user);

    li.appendChild(userSpan);
    li.appendChild(btnInvite);
    li.appendChild(btnDM);
    li.appendChild(btnBlock);

    usersContainer.appendChild(li);
  });
}

function invite(target: string) {
  if (!socket) return;
  if (confirm(`Voulez-vous inviter ${target} ?`)) {
    socket.send(JSON.stringify({ type: 'invite', to: target }));
  }
}

function addMessageToChannel(message: Message) {
  const channelId = message.type === 'message' ? 'global' : (message.from === 'Moi' ? message.to! : message.from);
  if (!channels.has(channelId)) {
    channels.set(channelId, { id: channelId, title: channelId, messages: [] });
  }
  channels.get(channelId)!.messages.push(message);
}

function renderChannelsTabs() {
  const tabsContainer = document.getElementById('channels-tabs')!;
  tabsContainer.innerHTML = '';

  channels.forEach((channel, id) => {
    const tab = document.createElement('div');
    tab.textContent = channel.title;

    tab.className = 'cursor-pointer px-3 py-1 rounded ' + (id === currentChannelId ? 'bg-blue-600 text-white' : 'bg-gray-200');

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
  const messagesContainer = document.getElementById('messages')!;
  messagesContainer.innerHTML = '';

  const channel = channels.get(currentChannelId);
  if (!channel) return;

  channel.messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'p-1 rounded ' + (msg.from === 'Moi' ? 'bg-blue-100 self-end' : 'bg-gray-200');

    let fromText = msg.from;
    if (msg.from === 'Moi') fromText = 'Vous';

    div.textContent = `[${fromText}] ${msg.content}`;
    messagesContainer.appendChild(div);
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
  }

  currentChannelId = username;
  renderChannelsTabs();
  renderMessages();
}

function updateBlockButton(username: string, blocked: boolean) {
  const usersContainer = document.getElementById('users');
  if (!usersContainer) return;

  const listItems = usersContainer.querySelectorAll('li');
  listItems.forEach(li => {
    const userSpan = li.querySelector('span.text-blue-600');
    if (userSpan && userSpan.textContent === username) {
      const btn = li.querySelector('button.text-red-500, button.text-green-500');
      if (btn) {
        btn.textContent = blocked ? 'Débloquer' : 'Bloquer';
        btn.className = blocked
          ? 'text-green-500 hover:underline cursor-pointer'
          : 'text-red-500 hover:underline cursor-pointer';
      }
    }
  });
}

(window as any).block = (target: string) => {
  if (blockedUsers.has(target)) {
    if (confirm(`Voulez-vous débloquer ${target} ?`)) {
      blockedUsers.delete(target);
      localStorage.setItem('blockedUsers', JSON.stringify(Array.from(blockedUsers)));
      socket!.send(JSON.stringify({ type: 'unblock', target }));
      updateBlockButton(target, false);
    }
  } else {
    if (confirm(`Voulez-vous bloquer ${target} ?`)) {
      blockedUsers.add(target);
      localStorage.setItem('blockedUsers', JSON.stringify(Array.from(blockedUsers)));
      socket!.send(JSON.stringify({ type: 'block', target }));
      updateBlockButton(target, true);
    }
  }
};
