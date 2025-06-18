import { navigate } from "../main.js";
export async function renderSettings() {
    const res = await fetch('/api/me');
    if (res.status === 401) {
        navigate('/auth');
        return;
    }
    const user = await res.json();
    const userId = user.id;
    console.log(user.avatar);
    const avatarUrl = user.avatar || '/avatar/default.png'; // Fallback si jamais
    const app = document.getElementById('app');
    app.innerHTML = `
	<div class="flex justify-center items-center min-h-screen bg-gradient-to-br from-pink-100 via-violet-100 to-blue-100 font-sans">
		<form id="settingsForm" enctype="multipart/form-data" class="bg-white border-4 border-pink-300 p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6 animate-fade-in">
			<h2 class="text-3xl font-bold text-center text-pink-600 tracking-wide">🌸 My Settings 🌸</h2>

			<div class="">
				<img src="${avatarUrl}" alt="Current Avatar" class="w-24 h-24 mx-auto rounded-full border-4 border-violet-300 shadow-md object-cover mb-2" />
				<label class="block text-pink-700 font-semibold mb-1">✨ Change Avatar</label>
				<input type="file" name="avatar" class="w-full border border-violet-300 p-2 rounded-lg bg-pink-50 text-pink-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200 transition" />
			</div>

			<div>
				<label class="block text-pink-700 font-semibold mb-1">🧸 Name</label>
				<input name="name" value="${user.name}" class="w-full border border-blue-200 p-2 rounded-lg bg-blue-50 text-blue-800 focus:outline-none focus:ring-2 focus:ring-pink-400 transition" />
			</div>

			<div>
				<label class="block text-pink-700 font-semibold mb-1">📧 Email</label>
				<input type="email" name="email" value="${user.email}" class="w-full border border-blue-200 p-2 rounded-lg bg-blue-50 text-blue-800 focus:outline-none focus:ring-2 focus:ring-pink-400 transition" />
			</div>

			<div>
				<label class="block text-pink-700 font-semibold mb-1">🔒 New Password</label>
				<input type="password" name="password" placeholder="••••••••" class="w-full border border-blue-200 p-2 rounded-lg bg-blue-50 text-blue-800 focus:outline-none focus:ring-2 focus:ring-pink-400 transition" />
			</div>

			<button type="submit" class="w-full bg-gradient-to-r from-pink-400 to-violet-400 text-white py-2 rounded-xl shadow-md hover:from-pink-500 hover:to-violet-500 transition duration-300 text-lg font-bold">
				💾 Update
			</button>
		</form>
	</div>
`;
    document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        if (formData.get('avatar') && formData.get('avatar').name !== '') {
            const avatarUpload = new FormData();
            avatarUpload.append('avatar', formData.get('avatar'));
            const avatarRes = await fetch('/api/updateAvatar', {
                method: 'POST',
                body: avatarUpload,
                credentials: 'include'
            });
            console.log('salut');
            if (!avatarRes.ok) {
                alert('Failed to upload avatar');
                return;
            }
        }
        const body = {};
        const nameValue = formData.get('name');
        if (nameValue && nameValue.trim() !== '')
            body.name = nameValue;
        const emailValue = formData.get('email');
        if (emailValue && emailValue.trim() !== '')
            body.email = emailValue;
        const passwordValue = formData.get('password');
        if (passwordValue && passwordValue.trim() !== '')
            body.password = passwordValue;
        const settingsRes = await fetch('/api/updateSettings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            credentials: 'include'
        });
        if (settingsRes.ok) {
            alert('Settings updated!');
            renderSettings();
        }
        else {
            const error = await settingsRes.json();
            alert('Error: ' + (error?.error || 'Unknown'));
        }
    });
}
