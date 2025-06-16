export async function renderAuth() {
    const app = document.getElementById('app');
    if (!app)
        return;
    app.innerHTML = `
    <div class="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 class="text-3xl font-bold mb-6 text-center">Connexion / Inscription</h1>

      <div id="formContainer">
        <!-- Form will be injected here -->
      </div>

      <div class="mt-4 text-center">
        <button id="toggleBtn" class="text-purple-600 underline hover:text-purple-800 cursor-pointer">
          Je n'ai pas de compte, je veux m'inscrire
        </button>
      </div>

      <div id="message" class="mt-4 text-center text-red-600"></div>
    </div>
  `;
    const formContainer = document.getElementById('formContainer');
    const toggleBtn = document.getElementById('toggleBtn');
    const message = document.getElementById('message');
    let isLogin = true;
    function renderForm() {
        if (isLogin) {
            formContainer.innerHTML = `
        <form id="authForm">
          <div class="mb-4">
            <label for="email" class="block mb-1 font-semibold">Email</label>
            <input type="email" id="email" required class="w-full border px-3 py-2 rounded" />
          </div>
          <div class="mb-4">
            <label for="password" class="block mb-1 font-semibold">Mot de passe</label>
            <input type="password" id="password" required class="w-full border px-3 py-2 rounded" />
          </div>
          <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Se connecter</button>
        </form>
      `;
            toggleBtn.textContent = "Je n'ai pas de compte, je veux m'inscrire";
        }
        else {
            formContainer.innerHTML = `
        <form id="authForm">
          <div class="mb-4">
            <label for="name" class="block mb-1 font-semibold">Nom</label>
            <input type="text" id="name" required class="w-full border px-3 py-2 rounded" />
          </div>
          <div class="mb-4">
            <label for="email" class="block mb-1 font-semibold">Email</label>
            <input type="email" id="email" required class="w-full border px-3 py-2 rounded" />
          </div>
          <div class="mb-4">
            <label for="password" class="block mb-1 font-semibold">Mot de passe</label>
            <input type="password" id="password" required class="w-full border px-3 py-2 rounded" />
          </div>
          <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">S'inscrire</button>
        </form>
      `;
            toggleBtn.textContent = "J'ai déjà un compte, je veux me connecter";
        }
        const authForm = document.getElementById('authForm');
        authForm.addEventListener('submit', onSubmit);
    }
    async function onSubmit(event) {
        event.preventDefault();
        message.textContent = '';
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
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
                if (!res.ok)
                    throw new Error(data.error || 'Erreur lors de la connexion');
                message.style.color = 'green';
                message.textContent = 'Connecté avec succès !';
                // Ici tu peux rediriger ou appeler une fonction pour afficher la page profil, etc.
            }
            catch (err) {
                message.style.color = 'red';
                message.textContent = err.message;
            }
        }
        else {
            // Register
            const name = document.getElementById('name').value.trim();
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
                if (!res.ok)
                    throw new Error(data.error || 'Erreur lors de l\'inscription');
                message.style.color = 'green';
                message.textContent = 'Inscription réussie, vous pouvez maintenant vous connecter.';
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
