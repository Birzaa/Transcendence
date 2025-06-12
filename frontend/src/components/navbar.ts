export function navBar() : HTMLElement{
	const nav = document.createElement('nav');
	nav.innerHTML = `
	<nav class= "flex justify-center space-x-4"> 
		<a href="/" class="font-medium  rounded-lg px-3 py-3 hover:bg-gray-700">Home</a>
		<a href="/chat" class="font-medium  rounded-lg px-3 py-3 hover:bg-gray-700">Chat</a>
		<a href="/profil" class="font-medium  rounded-lg px-3 py-3 hover:bg-gray-700">Profil</a>
		<a href="/auth" class="font-medium  rounded-lg px-3 py-3 hover:bg-gray-700">Login</a>
	</nav>
	`;

	return nav;
}