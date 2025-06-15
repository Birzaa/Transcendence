export function navBar() {
    const nav = document.createElement('nav');
    nav.innerHTML = `
	<nav class="flex justify-between items-center px-6 py-4 bg-pink-400 text-white text-2xl z-10">
 		<div>
   			<a href="/" class="font-medium  rounded-lg px-3 py-3 hover:bg-gray-700">LOGO</a>
  		</div>
		<div class="flex space-x-10 m-10">
			<a href="/" class="font-medium  rounded-lg px-3 py-3 hover:bg-gray-700">Home</a>
			<a href="/chat" class="font-medium  rounded-lg px-3 py-3 hover:bg-gray-700">Chat</a>
			<a href="/profil" class="font-medium  rounded-lg px-3 py-3 hover:bg-gray-700">Profile</a>
			<a href="/auth" class="font-medium  rounded-lg px-3 py-3 hover:bg-gray-700">Login</a>
		</div>
	</nav>
	`;
    return nav;
}
