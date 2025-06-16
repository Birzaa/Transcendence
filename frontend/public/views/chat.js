let socket = null;
const blockedUsers = new Set(JSON.parse(localStorage.getItem('blockedUsers') || '[]'));
export function renderChat() {
    const app = document.getElementById('app');
    if (!app)
        return;
    app.innerHTML = `
		<div class="flex h-[80vh] max-w-4xl mx-auto mt-10 bg-white rounded shadow overflow-hidden">
			<!-- Liste utilisateurs -->
			<div class="w-1/4 bg-gray-100 p-4 overflow-y-auto" id="user-list">
				<h3 class="font-bold mb-2">Utilisateurs connectés</h3>
				<ul id="users" class="space-y-2 text-sm"></ul>
			</div>

			<!-- Zone de chat -->
			<div class="flex-1 flex flex-col p-4">
				<h2 class="text-xl font-semibold mb-4 text-center">Chat global</h2>
				<div id="messages" class="flex-1 overflow-y-auto border rounded p-2 mb-2 space-y-1 bg-gray-50"></div>
				<div class="flex mt-2">
					<input id="input" type="text" placeholder="Votre message..." class="flex-1 border rounded p-2 mr-2" />
					<button id="send" class="bg-blue-500 text-white px-4 py-2 rounded">Envoyer</button>
				</div>
			</div>
		</div>
	`;
    initChatWebSocket();
}
async function initChatWebSocket() {
    let username = 'WhoAreU?';
    try {
        const res = await fetch('/api/me');
        if (res.ok) {
            const data = await res.json();
            username = data.name;
        }
    }
    catch (err) {
        console.warn('Utilisateur non connecté ou erreur de session.');
    }
    // Fermer l’ancienne connexion si elle existe
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
        socket = null;
    }
    setupWebSocket(username);
}
function setupWebSocket(username) {
    socket = new WebSocket('ws://localhost:3001/ws');
    const messagesContainer = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendButton = document.getElementById('send');
    const usersContainer = document.getElementById('users');
    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'set_username', username }));
    };
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
            if (data.from !== username && blockedUsers.has(data.from))
                return;
            const div = document.createElement('div');
            div.textContent = `${data.from} : ${data.content}`;
            div.className = 'bg-gray-200 p-2 rounded break-words break-all w-full overflow-hidden';
            messagesContainer.appendChild(div);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        if (data.type === 'user_list') {
            usersContainer.innerHTML = '';
            data.users.forEach((user) => {
                const isSelf = user === username;
                const isBlocked = blockedUsers.has(user);
                const li = document.createElement('li');
                li.innerHTML = `
					<div class="flex justify-between items-center">
						<a href="/profil" onclick="event.preventDefault(); openUserProfile('${user}');" class="text-blue-600 hover:underline cursor-pointer">${user}</a>
						<div class="space-x-1">
							<button class="text-blue-500 hover:underline" onclick="invite('${user}')">Inviter</button>
							${!isSelf ? `<button class="${isBlocked ? 'text-green-500' : 'text-red-500'} hover:underline cursor-pointer" onclick="block('${user}')">${isBlocked ? 'Débloquer' : 'Bloquer'}</button>` : ''}
						</div>
					</div>
				`;
                usersContainer.appendChild(li);
            });
        }
    };
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && input.value.trim()) {
            e.preventDefault();
            socket.send(JSON.stringify({ type: 'message', content: input.value }));
            input.value = '';
        }
    });
    sendButton.addEventListener('click', () => {
        if (input.value.trim()) {
            socket.send(JSON.stringify({ type: 'message', content: input.value }));
            input.value = '';
        }
    });
    window.invite = (targetUsername) => {
        if (confirm(`Voulez-vous inviter ${targetUsername} ?`)) {
            socket.send(JSON.stringify({ type: 'invite', to: targetUsername }));
        }
    };
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
    function updateBlockButton(username, blocked) {
        const usersContainer = document.getElementById('users');
        if (!usersContainer)
            return;
        const listItems = usersContainer.querySelectorAll('li');
        listItems.forEach(li => {
            const userLink = li.querySelector('a');
            if (userLink && userLink.textContent === username) {
                const btn = li.querySelector('button.text-red-500, button.text-green-500');
                if (btn) {
                    btn.textContent = blocked ? 'Débloquer' : 'Bloquer';
                    btn.className = blocked ? 'text-green-500 hover:underline cursor-pointer' : 'text-red-500 hover:underline cursor-pointer';
                }
            }
        });
    }
    function renderUserList() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'request_user_list' }));
        }
    }
    window.openUserProfile = (username) => {
        window.location.href = `/profil`;
        // Si besoin de passer le nom en query param, décommenter la ligne suivante :
        // window.location.href = `/profil?user=${encodeURIComponent(username)}`;
    };
}
