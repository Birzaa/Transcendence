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
    const socket = new WebSocket('ws://localhost:3001/ws');
    const messagesContainer = document.getElementById('messages');
    const input = document.getElementById('input');
    const sendButton = document.getElementById('send');
    const usersContainer = document.getElementById('users');
    const blockedUsers = new Set();
    socket.onopen = () => {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({ type: 'set_username', username: 'Test' }));
    };
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
            if (blockedUsers.has(data.from))
                return;
            const div = document.createElement('div');
            div.textContent = `${data.from} : ${data.content}`;
            div.className = 'bg-gray-200 p-2 rounded break-words break-all w-full overflow-hidden';
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
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
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
    window.invite = (username) => {
        socket.send(JSON.stringify({ type: 'invite', to: username }));
    };
    window.block = (username) => {
        blockedUsers.add(username);
        socket.send(JSON.stringify({ type: 'block', target: username }));
    };
}
// const token = localStorage.getItem('token'); // ou depuis les cookies si tu utilises ça
// if (!token) {
// 	alert("Vous devez être connecté pour accéder au chat.");
// 	window.location.href = "/login"; // redirection si non connecté
// }
// const socket = new WebSocket(`ws://localhost:3001/ws?token=${encodeURIComponent(token)}`);
// import { FastifyInstance } from 'fastify';
// import { WebSocketServer, WebSocket } from 'ws';
// import { parse } from 'url';
// import jwt from 'jsonwebtoken';
// interface ExtendedWebSocket extends WebSocket {
// 	username?: string;
// }
// const JWT_SECRET = 'votre_clé_secrète'; // Même clé que celle utilisée pour signer les JWT
// export default async function setupWebSocket(fastify: FastifyInstance) {
// 	const wss = new WebSocketServer({ noServer: true });
// 	wss.on('connection', (socket: ExtendedWebSocket, request) => {
// 		const parsedUrl = parse(request.url!, true);
// 		const token = parsedUrl.query.token?.toString();
// 		if (!token) {
// 			socket.close(4001, 'Token manquant');
// 			return;
// 		}
// 		try {
// 			const payload = jwt.verify(token, JWT_SECRET) as { username: string };
// 			socket.username = payload.username;
// 			console.log(`[+] ${socket.username} connecté`);
// 			socket.send(JSON.stringify({ type: 'message', from: 'Server', content: 'Bienvenue dans le chat !' }));
// 			socket.on('message', (msg) => {
// 				const data = JSON.parse(msg.toString());
// 				if (data.type === 'message') {
// 					wss.clients.forEach(client => {
// 						if (client.readyState === WebSocket.OPEN) {
// 							client.send(JSON.stringify({
// 								type: 'message',
// 								from: socket.username,
// 								content: data.content,
// 							}));
// 						}
// 					});
// 				}
// 			});
// 		} catch (err) {
// 			socket.close(4002, 'Token invalide');
// 		}
// 	});
// 	fastify.server.on('upgrade', (request, socket, head) => {
// 		if (request.url?.startsWith('/ws')) {
// 			wss.handleUpgrade(request, socket, head, (ws) => {
// 				wss.emit('connection', ws as ExtendedWebSocket, request);
// 			});
// 		}
// 	});
// }
