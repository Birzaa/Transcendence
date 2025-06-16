export async function renderProfil(): Promise<void> {
	const app = document.getElementById('app')!;

	app.innerHTML = `
		<div class="flex">
			<!-- Sidebar -->
			<div class="w-1/6 h-[calc(100vh-168px)] fixed top-42 left-0 p-4 bg-slate-700 flex flex-col justify-between pt-[100px]">
				<div>
					<label for="playerName" class="block text-white mb-2 text-lg font-semibold">Find a game :</label>
					<input
						id="playerName"
						type="text"
						placeholder="Name's player..."
						class="w-full p-2 rounded bg-gray-200 text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
					/>
				</div>
				<div class="flex flex-col gap-4">
					<button class="text-xl p-2 bg-purple-600 rounded-lg shadow-md hover:bg-purple-800">Settings</button>
					<button class="text-xl p-2 bg-red-600 rounded-lg shadow-md hover:bg-red-800">Delete my account</button>
				</div>
			</div>

			<!-- History -->
			<div class="ml-[16.6667%] w-5/6 bg-slate-600 min-h-screen px-10 py-8">
				<h1 class="text-5xl font-bold text-center text-white pb-4 border-b-2 border-white mb-8">
					Games history
				</h1>
				<div class="flex flex-col gap-4" id=gamesHistory></div>
			</div>
		</div>
	`;

	const games = document.getElementById('gamesHistory');

	const res = await fetch('/api/me', { credentials: 'include'});
	const user = await res.json();
	console.log(user.id);
	
}
