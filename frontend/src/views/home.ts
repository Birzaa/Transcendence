export function renderHome(): void {
	const app = document.getElementById('app')!;
	app.innerHTML = `
		<h1 class="text-4xl text-center">Bienvenue sur la page d’accueil</h1>
	`;
}
