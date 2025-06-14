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
    setupWebSocket();
}
function setupWebSocket() {
    const socket = new WebSocket('ws://localhost:3000/ws');
    const messagesContainer = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendButton = document.getElementById('send');
    const usersContainer = document.getElementById('users');
    socket.onopen = () => {
        console.log('✅ WebSocket connecté');
    };
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
            const div = document.createElement('div');
            div.textContent = `${data.from}: ${data.content}`;
            div.className = 'bg-gray-200 p-2 rounded';
            messagesContainer.appendChild(div);
        }
        if (data.type === 'user_list') {
            usersContainer.innerHTML = ''; // Clear list
            data.users.forEach((user) => {
                const li = document.createElement('li');
                li.innerHTML = `
					<div class="flex justify-between items-center">
						<span>${user}</span>
						<div class="space-x-1">
							<button class="text-blue-500 hover:underline" onclick="invite('${user}')">Inviter</button>
							<button class="text-red-500 hover:underline" onclick="block('${user}')">Bloquer</button>
						</div>
					</div>
				`;
                usersContainer.appendChild(li);
            });
        }
    };
    sendButton.addEventListener('click', () => {
        if (input.value.trim()) {
            socket.send(JSON.stringify({ type: 'message', content: input.value }));
            input.value = '';
        }
    });
    window.invite = (username) => {
        socket.send(JSON.stringify({ type: 'invite', to: username }));
    };
    window.block = (username) => {
        socket.send(JSON.stringify({ type: 'block', target: username }));
    };
}
