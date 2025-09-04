let translations = {};
let currentLanguage = "fr";
/**
 * Load JSON translation files dynamically
 */
export async function loadTranslations() {
    const [fr, en, es] = await Promise.all([
        fetch("/src/utils/locales/fr.json").then((res) => res.json()),
        fetch("/src/utils/locales/en.json").then((res) => res.json()),
        fetch("/src/utils/locales/es.json").then((res) => res.json()),
    ]);
    translations = { fr, en, es };
}
/**
 * Get translation by key
 */
export function t(key) {
    return translations[currentLanguage]?.[key] || key;
}
/**
 * Change language
 */
export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem("lang", lang);
        updateUI();
    }
}
/**
 * Get current language
 */
export function getLanguage() {
    return currentLanguage;
}
/**
 * Update UI elements with data-i18n
 */
export function updateUI() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (key && translations[currentLanguage][key]) {
            el.textContent = translations[currentLanguage][key];
        }
    });
    const select = document.getElementById("language-select");
    if (select)
        select.value = currentLanguage;
}
/**
 * Initialize i18n
 */
export function initI18n() {
    const savedLang = localStorage.getItem("lang");
    if (savedLang && translations[savedLang])
        currentLanguage = savedLang;
    const select = document.getElementById("language-select");
    if (select) {
        select.addEventListener("change", (e) => {
            const target = e.target;
            setLanguage(target.value);
        });
    }
    updateUI();
}
