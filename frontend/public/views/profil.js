export function renderProfil() {
    const app = document.getElementById('app');
    app.innerHTML = `
		<div class="flex flex-row">
			<div class="basis-1/6 bg-slate-500 p-4"> 
				<div class="text-2xl"> 
					<button class="text-2xl p-2 bg-purple-600 rounded-lg shadow-md hover:bg-purple-800">Settings
				</div>
				<div>
					<button class="text-2xl p-2 bg-red-600 rounded-lg shadow-md hover:bg-red-800">Delete my account</button>
				</div>
			</div>
			<div class="basis-5/6 bg-slate-600 flex items-center justify-center">
				<div class="text-center text-5xl font-bold">
					Game history
				</div>
			</div>
		</div>
	`;
}
