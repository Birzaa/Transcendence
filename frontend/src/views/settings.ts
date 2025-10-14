import { navigate } from "../main.js";

export async function renderSettings(): Promise<void> {
  const res = await fetch("/api/me", { credentials: "include" });

  if (res.status === 401) {
    navigate("/auth");
    return;
  }

  const user = await res.json();
  const avatarUrl = user.avatar || "/avatar/default.png";

  const app = document.getElementById("app")!;
  app.innerHTML = `
  <!-- Fond -->
  <div class="min-h-screen bg-[url('/images/background.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
    <div class="min-h-screen flex items-center justify-center">
      <div class="max-w-md w-full bg-pink-50 bg-opacity-90 shadow-lg border-2 border-purple-300">
        
        <!-- Barre de titre -->
        <div class="bg-purple-600 text-pink-100 p-3">
          <h1 class="text-xl font-bold text-center">Paramètres du compte</h1>
        </div>

        <!-- Contenu -->
        <div class="p-6">
          <form id="settingsForm" enctype="multipart/form-data" class="space-y-5">

            <!-- Avatar stylé -->
            <div class="flex flex-col items-center">
              <div class="relative group cursor-pointer">
                <img src="${avatarUrl}" alt="Avatar actuel"
                     class="w-28 h-28 rounded-full border-4 border-purple-300 shadow-md object-cover transition duration-300 group-hover:shadow-[0_0_15px_rgba(192,132,252,0.7)] group-hover:scale-105" />
                <div class="absolute inset-0 bg-purple-600/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 rounded-full">
                  <span class="text-pink-100 text-sm font-semibold">Changer</span>
                </div>
              </div>
              <input id="avatarInput" type="file" name="avatar" accept="image/*" class="hidden" />
              <p class="text-xs text-purple-500 mt-2 italic">Clique sur ton avatar pour le changer ✨</p>
            </div>

            <!-- Nom -->
            <div class="flex items-center">
              <label for="name" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">🧸 Nom</label>
              <span class="text-purple-300 mx-1 text-lg">☆</span>
              <input id="name" name="name" value="${user.name}"
                     class="flex-1 border-3 border-purple-300 px-3 py-2 bg-white focus:border-purple-400 focus:outline-none transition rounded-none" />
            </div>

            <!-- Email -->
            <div class="flex items-center">
              <label for="email" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">📧 Email</label>
              <span class="text-purple-300 mx-1 text-lg">☆</span>
              <input type="email" id="email" name="email" value="${user.email}"
                     class="flex-1 border-3 border-purple-300 px-3 py-2 bg-white focus:border-purple-400 focus:outline-none transition rounded-none" />
            </div>

            <!-- Mot de passe -->
            <div class="flex items-center">
              <label for="password" class="whitespace-nowrap font-semibold mr-2 text-purple-600 w-32">🔒 Mot de passe</label>
              <span class="text-purple-300 mx-1 text-lg">☆</span>
              <input type="password" id="password" name="password" placeholder="••••••••"
                     class="flex-1 border-3 border-purple-300 px-3 py-2 bg-white focus:border-purple-400 focus:outline-none transition rounded-none" />
            </div>

            <!-- Bouton -->
            <div class="pt-4 flex justify-center">
              <button type="submit"
                      class="relative px-8 py-2 bg-purple-200 border-2 border-t-white border-l-white border-r-purple-400 border-b-purple-400 
                             text-purple-800 font-bold
                             shadow-[2px_2px_0px_0px_rgba(147,51,234,0.3)]
                             active:shadow-none active:translate-y-[2px] active:border-purple-300
                             transition-all duration-100">
                💾 Sauvegarder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
`;

  // Sélecteur du conteneur de l'avatar
  const avatarContainer = document.querySelector(".relative.group") as HTMLDivElement;
  const avatarInput = document.getElementById("avatarInput") as HTMLInputElement;
  const avatarImg = avatarContainer.querySelector("img") as HTMLImageElement;

  // Ouvre le sélecteur de fichier en cliquant sur le container (image + overlay)
  avatarContainer.addEventListener("click", () => avatarInput.click());

  // Prévisualisation immédiate
  avatarInput.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        avatarImg.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  });

  // Soumission du formulaire
  document.getElementById("settingsForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Upload avatar
    if (formData.get("avatar") && (formData.get("avatar") as File).name !== "") {
      const avatarUpload = new FormData();
      avatarUpload.append("avatar", formData.get("avatar")!);
      const avatarRes = await fetch("/api/updateAvatar", {
        method: "POST",
        body: avatarUpload,
        credentials: "include",
      });
      if (!avatarRes.ok) {
        alert("Échec du changement d'avatar");
        return;
      }
    }

    // Autres champs
    const body: any = {};
    const nameValue = formData.get("name") as string;
    if (nameValue?.trim()) body.name = nameValue;

    const emailValue = formData.get("email") as string;
    if (emailValue?.trim()) body.email = emailValue;

    const passwordValue = formData.get("password") as string;
    if (passwordValue?.trim()) body.password = passwordValue;

    const settingsRes = await fetch("/api/updateSettings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (settingsRes.ok) {
      alert("🌸 Paramètres mis à jour !");
      renderSettings();
    } else {
      const error = await settingsRes.json();
      alert("Erreur : " + (error?.error || "Inconnue"));
    }
  });
}
