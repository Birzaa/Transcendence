import { navigate } from "../main.js";

export function renderGameSettings(): void {
    const app = document.getElementById("app");
    if (!app) return;

    const url = new URL(window.location.href);
    const mode = url.searchParams.get("mode");

    const color1 = url.searchParams.get("color1");
    const color2 = url.searchParams.get("color2");
    const score = url.searchParams.get("score");

    if (mode === "1v1" && color1 && color2 && score) {
        import("./1vs1.js").then((m) => m.render1vs1());
        return;
    }
    if (mode === "solo" && color1 && score) {
        import("./solo.js").then((m) => m.renderSoloGame());
        return;
    }
    if (mode === "tournament" && color1 && color2) {
        import("./tournament.js").then((m) => m.renderTournament());
        return;
    }

    app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
        <div class="min-h-screen flex items-center justify-center">
            <div class="max-w-lg w-full bg-pink-50 bg-opacity-95 shadow-lg border-2 border-purple-300">
                <div class="bg-purple-600 text-pink-100 p-3">
                    <h1 class="text-xl font-bold text-center" data-i18n="${mode === "1v1" ? "1vs1" : "ModeSolo"}">
                        ${mode === "1v1" ? "1 vs 1" : "Solo Mode"}
                    </h1>
                </div>
                <div class="p-6">
                    <form id="settings-form" class="space-y-6">

                        <!-- Raquette joueur 1 -->
                        <div> 
                            <h3 class="text-purple-600 font-bold text-center mb-2" data-i18n="Solo_Player">PLAYER</h3>
                            <div class="pt-4 flex justify-center gap-2 flex-wrap">
                                ${["bleu","vert","jaune","orange","rose","rouge","violet","gris"].map(c => `
                                    <label>
                                        <input type="radio" name="color1" value="${c}" ${c==="gris"?"checked":""} class="hidden">
                                        <img src="/images/raquette_${c}.png" class="paddle-option cursor-pointer w-7 h-24 border-2 ${c==="gris"?"border-purple-400":"border-transparent"} rounded" />
                                    </label>
                                `).join("")}
                            </div>
                        </div>

                        <!-- Raquette joueur 2 (seulement en 1v1) -->
                        ${mode==="1v1"?`
                        <div>
                            <h3 class="text-purple-600 font-bold text-center mb-2" data-i18n="Solo_Bot">BOT</h3>
                            <div class="pt-4 flex justify-center gap-2">
                                ${["bleu","vert","jaune","orange","rose","rouge","violet","gris"].map(c => `
                                    <label>
                                        <input type="radio" name="color2" value="${c}" ${c==="gris"?"checked":""} class="hidden">
                                        <img src="/images/raquette_${c}.png" class="paddle-option cursor-pointer w-7 h-24 border-2 ${c==="gris"?"border-purple-400":"border-transparent"} rounded" />
                                    </label>
                                `).join("")}
                            </div>
                        </div>
                        `:""}

                        <!-- Score limite -->
                        <div class="flex items-center justify-center gap-3">
                            <label for="score" class="text-purple-600 font-bold text-center" data-i18n="Score">Score to reach</label>
                            <input id="score" name="score" type="number" value="5" min="1" max="20"
                                class="px-2 py-1 relative bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                                text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                                active:shadow-none active:translate-y-[2px] active:border-purple-300 transition-all duration-100" />
                        </div>

                        <div class="pt-4 flex justify-center">
                            <button type="submit" class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400
                            text-purple-800 font-bold shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                            active:shadow-none active:translate-y-[2px] active:border-purple-300 transition-all duration-100" data-i18n="Start">
                                Start
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;

    // gestion visuelle
    const updateHighlight = (name: string) => {
        document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach(r => {
            const img = r.nextElementSibling as HTMLImageElement;
            if (img) img.style.borderColor = r.checked ? "#9e8bb0ff" : "transparent";
        });
    };
    document.querySelectorAll<HTMLInputElement>("input[name='color1'], input[name='color2']").forEach(input => {
        input.addEventListener("change", () => updateHighlight(input.name));
    });

    // Formulaire
    const form = document.getElementById("settings-form") as HTMLFormElement;
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const color1 = (formData.get("color1") as string) || "rose";
        const color2 = mode === "1v1" || mode === "tournament" ? ((formData.get("color2") as string) || "bleu") : "";
        const score = (formData.get("score") as string) || "5";
        if (mode === "1v1") {
            navigate(`/game?mode=1v1&color1=${color1}&color2=${color2}&score=${score}`);
        } else if (mode === "solo") {
            navigate(`/game?mode=solo&color1=${color1}&score=${score}`);
        }
    });
}
