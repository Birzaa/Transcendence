import { navigate, connectWebSocket, userState } from "../main.js";

export async function renderAuth(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
  <!-- Conteneur principal avec l'image de fond -->
  <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
    <!-- Conteneur du formulaire centré -->
    <div class="min-h-screen flex items-center justify-center">
      <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
        <!-- Barre violette avec titre -->
        <div class="bg-purple-600 text-pink-100 p-3">
          <h1 class="text-xl font-bold text-center">Connexion</h1>
        </div>

        <!-- Contenu du formulaire -->
        <div class="p-6">
          <div id="formContainer">
            <!-- Form will be injected here -->
          </div>

          <div class="mt-4 text-center">
            <button id="toggleBtn" class="text-purple-600 underline hover:text-purple-800 cursor-pointer">
              Je n'ai pas de compte, je veux m'inscrire
            </button>
          </div>

          <div id="message" class="mt-4 text-center text-pink-500"></div>
        </div>
      </div>
    </div>
  </div>
`;

  const formContainer = document.getElementById('formContainer')!;
  const toggleBtn = document.getElementById('toggleBtn')!;
  const message = document.getElementById('message')!;

  let isLogin = true;

  function renderForm() {
    if (isLogin) {
      formContainer.innerHTML = `
              <form id="authForm" class="space-y-4">
          <div class="flex items-center">
            <label for="email" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">Email</label>
            <span class="text-purple-300 mx-1 text-lg">☆</span>
            <input type="email" id="email" required 
                  class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
          </div>

          <div class="flex items-center">
            <label for="password" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">Mot de passe</label>
            <span class="text-purple-300 mx-1 text-lg">☆</span>
            <input type="password" id="password" required 
                  class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
          </div>

          <div class="pt-4 flex justify-center">
            <button type="submit" 
                    class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                          text-purple-800 font-bold
                          shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                          active:shadow-none active:translate-y-[2px] active:border-purple-300
                          transition-all duration-100">
              Connexion
            </button>
          </div>
        </form>
      `;
      toggleBtn.textContent = "Je n'ai pas de compte, je veux m'inscrire";
    } else {
      formContainer.innerHTML = `
        <form id="authForm" class="space-y-4">
          <div class="flex items-center">
            <label for="name" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">Nom</label>
            <span class="text-purple-300 mx-1 text-lg">☆</span>
            <input type="text" id="name" required 
                  class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
          </div>

          <div class="flex items-center">
            <label for="email" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">Email</label>
            <span class="text-purple-300 mx-1 text-lg">☆</span>
            <input type="email" id="email" required 
                  class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
          </div>

          <div class="flex items-center">
            <label for="password" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">Mot de passe</label>
            <span class="text-purple-300 mx-1 text-lg">☆</span>
            <input type="password" id="password" required 
                  class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
          </div>

          <div class="pt-4 flex justify-center">
            <button type="submit" 
                    class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                          text-purple-800 font-bold
                          shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                          active:shadow-none active:translate-y-[2px] active:border-purple-300
                          transition-all duration-100">
              S'inscrire
            </button>
          </div>
        </form>
      `;
      toggleBtn.textContent = "J'ai déjà un compte, je veux me connecter";
    }

    const authForm = document.getElementById('authForm') as HTMLFormElement;
    authForm.addEventListener('submit', onSubmit);
  }

  async function onSubmit(event: Event) {
    event.preventDefault();
    message.textContent = '';

    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value.trim();

    if (isLogin) {
      // Login
      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Erreur lors de la connexion');

        message.style.color = 'green';
        message.textContent = 'Connecté avec succès !';

        const userRes = await fetch('/api/me', { credentials: 'include' });
        if (!userRes.ok) throw new Error('Impossible de récupérer l’utilisateur');

        const user = await userRes.json();
        userState.currentUsername = user.name || 'anonymous';

        // Maintenant on connecte la WS en donnant directement le nom d’utilisateur
        await connectWebSocket(userState.currentUsername);
        navigate('/');

        // Ici tu peux rediriger ou appeler une fonction pour afficher la page profil, etc.
      } catch (err: any) {
        message.style.color = 'red';
        message.textContent = err.message;
      }
    } else {
      // Register
      const name = (document.getElementById('name') as HTMLInputElement).value.trim();
      if (!name) {
        message.style.color = 'red';
        message.textContent = 'Le nom est requis';
        return;
      }

      try {
        const res = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'inscription');

        message.style.color = 'green';
        message.textContent = 'Inscription réussie, vous pouvez maintenant vous connecter.';

        isLogin = true;
        renderForm();
      } catch (err: any) {
        message.style.color = 'red';
        message.textContent = err.message;
      }
    }
  }

  toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    message.textContent = '';
    renderForm();
  });

  renderForm();
}