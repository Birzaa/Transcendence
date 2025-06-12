export function renderAuth(navigate: (path :string) => void): void {
	const app = document.getElementById("app")!;
	app.innerHTML = `
        <h1 class="text-3xl font-bold mb-4">Connexion</h1>
        <button class="btn px-4 py-2 bg-blue-600 text-white rounded" id="home">Home</button>
      `;
      document.getElementById('home')?.addEventListener('click', () => {
        navigate('/');
      });
}