export async function navBar() {
    // Verification de connexion
    let isLogin = false;
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.ok)
        isLogin = true;
    const nav = document.createElement('nav');
    nav.innerHTML = `
		<nav class="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 bg-pink-400/90 backdrop-blur-sm shadow-md text-white text-2xl">
			<div>
				<a href="/" class="font-medium rounded-lg px-3 py-3 hover:bg-gray-700">LOGO</a>
			</div>
			<div class="flex space-x-10 m-10">
				<a href="/" class="font-medium rounded-lg px-3 py-3 hover:bg-gray-700">Home</a>
				<a href="/chat" class="font-medium rounded-lg px-3 py-3 hover:bg-gray-700">Chat</a>
				<a href="/profil" class="font-medium rounded-lg px-3 py-3 hover:bg-gray-700">Profile</a>
				${isLogin
        ? `<a href="/logout" class="font-medium rounded-lg px-3 py-3 hover:bg-gray-700">Logout</a>`
        : `<a href="/auth" class="font-medium rounded-lg px-3 py-3 hover:bg-gray-700">Login</a>`}
			</div>
		</nav>
	`;
    return nav;
}
