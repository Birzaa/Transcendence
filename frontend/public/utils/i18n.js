let currentLang = localStorage.getItem("lang") || "fr";
let translations = {};
export async function loadLanguage(lang) {
    const response = await fetch(`/locales/${lang}.json`);
    translations = await response.json();
    currentLang = lang;
    localStorage.setItem("lang", lang);
    updateUI();
}
export function t(key) {
    return translations[key] || key;
}
function updateUI() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (key)
            el.textContent = t(key);
    });
}
// Charger par défaut au lancement
loadLanguage(currentLang);
