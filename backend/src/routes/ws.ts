import { FastifyInstance } from 'fastify';
import { WebSocket, WebSocketServer } from 'ws';

export default async function setupWebSocket(fastify: FastifyInstance) {
  const wss = new WebSocketServer({ noServer: true });

  const clients = new Map<WebSocket, string>(); // socket -> username
  const blockedMap = new Map<string, Set<string>>(); // username -> Set of blocked usernames
  const hasWelcomed = new WeakSet<WebSocket>(); // Pour suivre les sockets déjà accueillis

  function broadcastUserList() {
    const userListMessage = JSON.stringify({
      type: 'user_list',
      users: Array.from(clients.values()),
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(userListMessage);
      }
    });
  }

  function getSocketByUsername(username: string): WebSocket | undefined {
    for (const [sock, name] of clients.entries()) {
      if (name === username) {
        return sock;
      }
    }
    return undefined;
  }

  wss.on('connection', (socket, request) => {
    const clientIp = request.socket.remoteAddress;
    console.log('Nouvelle connexion WebSocket depuis:', clientIp);
    
    // Envoyer le message de bienvenue seulement si ce socket n'a pas déjà été accueilli
    if (!hasWelcomed.has(socket)) {
      socket.send(JSON.stringify({ type: 'message', from: 'Server', content: 'Bienvenue dans le chat !' }));
      hasWelcomed.add(socket);
    }

    let username: string = 'anonymous';

    socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Message reçu du client', clientIp, ':', data);

        // 1. Définition du username
        if (data.type === 'set_username') {
          username = data.username;
          
          // Vérifier si ce username est déjà connecté via un autre socket
          const existingSocket = getSocketByUsername(username);
          if (existingSocket && existingSocket !== socket) {
            console.log(`Username ${username} déjà connecté, fermeture de l'ancienne connexion`);
            existingSocket.close();
            clients.delete(existingSocket);
          }
          
          clients.set(socket, username);
          if (!blockedMap.has(username)) blockedMap.set(username, new Set());
          console.log(`Username défini pour ${clientIp}: ${username}`);
          broadcastUserList();
          return;
        }

        // 2. Blocage / Déblocage
        if (data.type === 'block' && username) {
          blockedMap.get(username)?.add(data.target);
          console.log(`${username} a bloqué ${data.target}`);
          return;
        }

        if (data.type === 'unblock' && username) {
          blockedMap.get(username)?.delete(data.target);
          console.log(`${username} a débloqué ${data.target}`);
          return;
        }

        // 3. Message global - CORRIGÉ : Renvoyer aussi à l'expéditeur
        if (data.type === 'message' && username) {
          console.log(`Message global de ${username}: ${data.content}`);
          
          const payload = JSON.stringify({
            type: 'message',
            from: username,
            content: data.content,
          });

          wss.clients.forEach(client => {
            const recipientUsername = clients.get(client);
            if (
              client.readyState === WebSocket.OPEN &&
              recipientUsername &&
              !blockedMap.get(username)?.has(recipientUsername) &&
              !blockedMap.get(recipientUsername)?.has(username)
            ) {
              client.send(payload);
            }
          });
          return;
        }

        // 4. Message privé - CORRIGÉ : Renvoyer aussi à l'expéditeur
        if (data.type === 'private_message' && username) {
          const recipientName = data.to;
          const recipientSocket = getSocketByUsername(recipientName);

          console.log(`Message privé de ${username} à ${recipientName}: ${data.content}`);

          // Toujours renvoyer à l'expéditeur pour confirmation
          socket.send(JSON.stringify({
            type: 'private_message',
            from: username,
            to: recipientName,
            content: data.content
          }));

          // Envoyer au destinataire seulement s'il n'a pas bloqué l'expéditeur
          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            if (blockedMap.get(recipientName)?.has(username)) {
              console.log(`${recipientName} a bloqué ${username}, message non envoyé`);
              return;
            }

            recipientSocket.send(JSON.stringify({
              type: 'private_message',
              from: username,
              to: recipientName,
              content: data.content
            }));
          } else {
            console.log(`Destinataire ${recipientName} non trouvé ou non connecté`);
          }
          return;
        }

      } catch (err) {
        console.error('Invalid message format', err);
      }
    });

    socket.on('close', () => {
      console.log(`Utilisateur ${username} déconnecté (${clientIp})`);
      if (username) {
        clients.delete(socket);
        broadcastUserList();
      }
    });

    socket.on('error', (error) => {
      console.error('Erreur WebSocket pour', clientIp, ':', error);
    });
  });

  // WebSocket upgrade
  fastify.server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
}