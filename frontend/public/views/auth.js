import { navigate } from "../main.js";
import { updateUI } from "../utils/i18n.js"; // 🔹 utilise ton système existant
export async function renderAuth() {
    const app = document.getElementById('app');
    if (!app)
        return;
    app.innerHTML = `
  <!-- Conteneur principal avec l'image de fond -->
  <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
    <div class="min-h-screen flex items-center justify-center">
      <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
        <div class="bg-purple-600 text-pink-100 p-3">
          <h1 id="authTitle" class="text-xl font-bold text-center" data-i18n="Connexion">Connexion</h1>
        </div>

        <div class="p-6">
          <div id="formContainer"></div>

          <div class="mt-4 text-center">
            <button id="toggleBtn" class="text-purple-600 underline hover:text-purple-800 cursor-pointer" data-i18n="Jen_aipasdecompte_jeveuxm_inscrire">
              Je n'ai pas de compte, je veux m'inscrire
            </button>
          </div>

          <div id="message" class="mt-4 text-center text-pink-500"></div>
        </div>
      </div>
    </div>
  </div>
`;
    const formContainer = document.getElementById('formContainer');
    const toggleBtn = document.getElementById('toggleBtn');
    const message = document.getElementById('message');
    const authTitle = document.getElementById('authTitle');
    let isLogin = true;
    function renderForm() {
        if (isLogin) {
            authTitle.setAttribute("data-i18n", "Connexion");
            formContainer.innerHTML = `
              <form id="authForm" class="space-y-4">
                <div class="flex items-center">
                  <label for="email" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32" data-i18n="Email">Email</label>
                  <span class="text-purple-300 mx-1 text-lg">☆</span>
                  <input type="email" id="email" required 
                        class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
                </div>

                <div class="flex items-center">
                  <label for="password" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32" data-i18n="Motdepasse">Mot de passe</label>
                  <span class="text-purple-300 mx-1 text-lg">☆</span>
                  <input type="password" id="password" required 
                        class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
                </div>

                <div class="pt-4 flex justify-center">
                  <button type="submit" class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                        text-purple-800 font-bold
                        shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                        active:shadow-none active:translate-y-[2px] active:border-purple-300
                        transition-all duration-100" data-i18n="Connexion">
                    Connexion
                  </button>
                </div>
              </form>
            `;
            toggleBtn.setAttribute("data-i18n", "Jen_aipasdecompte_jeveuxm_inscrire");
        }
        else {
            authTitle.setAttribute("data-i18n", "Inscription");
            formContainer.innerHTML = `
              <form id="authForm" class="space-y-4">
                <div class="flex items-center">
                  <label for="name" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32" data-i18n="Nom">Nom</label>
                  <span class="text-purple-300 mx-1 text-lg">☆</span>
                  <input type="text" id="name" required 
                        class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
                </div>

                <div class="flex items-center">
                  <label for="email" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32" data-i18n="Email">Email</label>
                  <span class="text-purple-300 mx-1 text-lg">☆</span>
                  <input type="email" id="email" required 
                        class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
                </div>

                <div class="flex items-center">
                  <label for="password" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32" data-i18n="Motdepasse">Mot de passe</label>
                  <span class="text-purple-300 mx-1 text-lg">☆</span>
                  <input type="password" id="password" required 
                        class="flex-1 border-3 border-purple-300 px-3 py-2 rounded-none bg-white focus:border-purple-400" />
                </div>

                <div class="pt-4 flex justify-center">
                  <button type="submit" class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                        text-purple-800 font-bold
                        shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                        active:shadow-none active:translate-y-[2px] active:border-purple-300
                        transition-all duration-100" data-i18n="Inscription">
                    S'inscrire
                  </button>
                </div>
              </form>
            `;
            toggleBtn.setAttribute("data-i18n", "Jai_deja_un_compte_jeveux_me_connecter");
        }
        const authForm = document.getElementById('authForm');
        authForm.addEventListener('submit', onSubmit);
        // ⚡ Réapplique la traduction après chaque re-render
        updateUI();
    }
    async function onSubmit(event) {
        event.preventDefault();
        message.textContent = '';
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        if (isLogin) {
            try {
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password }),
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data.error || 'ErreurConnexion');
                message.style.color = 'green';
                message.setAttribute("data-i18n", "SuccesConnexion");
                updateUI();
                navigate('/');
            }
            catch (err) {
                message.style.color = 'red';
                message.textContent = err.message;
            }
        }
        else {
            const name = document.getElementById('name').value.trim();
            if (!name) {
                message.style.color = 'red';
                message.setAttribute("data-i18n", "NomRequis");
                updateUI();
                return;
            }
            try {
                const res = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data.error || 'ErreurInscription');
                message.style.color = 'green';
                message.setAttribute("data-i18n", "SuccesInscription");
                updateUI();
                isLogin = true;
                renderForm();
            }
            catch (err) {
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
