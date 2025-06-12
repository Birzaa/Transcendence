export function renderHome(navigate: (path: string) => void): void {
  const app = document.getElementById("app")!;
  app.innerHTML = `
    <h1 class="text-3xl font-bold mb-4">Home</h1>
    <button class="btn px-4 py-2 bg-blue-600 text-white rounded mr-2" id="profil">Profil</button>
    <button class="btn px-4 py-2 bg-green-600 text-white rounded mr-2" id="chat">Chat</button>
    <button class="btn px-4 py-2 bg-purple-600 text-white rounded" id="auth">Connexion</button>
  `;

  document.getElementById('profil')?.addEventListener('click', () => {
    navigate('/profil');
  });
  document.getElementById('chat')?.addEventListener('click', () => {
    navigate('/chat');
  });
  document.getElementById('auth')?.addEventListener('click', () => {
    navigate('/auth');
  });
}
