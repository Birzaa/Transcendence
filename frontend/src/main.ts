const app = document.getElementById("app")!;

function render(path: string): void {
  switch (path) {
    case '/':
  app.innerHTML = `
    <h1 class="text-3xl font-bold mb-4">Home</h1>
    <button class="btn px-4 py-2 bg-blue-600 text-white rounded mr-2" id="profil">Profil</button>
    <button class="btn px-4 py-2 bg-green-600 text-white rounded" id="chat">Chat</button>
  `;
  document.getElementById('profil')?.addEventListener('click', () => {
    navigate('/profil');
  });
  document.getElementById('chat')?.addEventListener('click', () => {
    navigate('/chat');
  });
  break;


    case '/profil':
      app.innerHTML = `
        <h1 class="text-3xl font-bold mb-4">Profil</h1>
        <button class="btn px-4 py-2 bg-blue-600 text-white rounded" id="home">Home</button>
      `;
      document.getElementById('home')?.addEventListener('click', () => {
        navigate('/');
      });
      break;

    case '/chat':
      app.innerHTML = `
        <h1 class="text-3xl font-bold mb-4">Chat</h1>
        <button class="btn px-4 py-2 bg-blue-600 text-white rounded" id="home">Home</button>
      `;
      document.getElementById('home')?.addEventListener('click', () => {
        navigate('/');
      });
      break;

    default:
      app.innerHTML = `<h1>Page non trouvée</h1>`;
  }
}

function navigate(path: string): void {
  window.history.pushState({}, '', path);
  render(path);
}

window.addEventListener('popstate', () => {
  render(window.location.pathname);
});

// Initialisation
render(window.location.pathname);
