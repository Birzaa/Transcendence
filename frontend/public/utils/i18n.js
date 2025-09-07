let translations = {};
let currentLanguage = "fr";
/**
 * Load JSON translation files dynamically
 */
export async function loadTranslations() {
    try {
        const [fr, en, es] = await Promise.all([
            fetch("/locales/fr.json").then((res) => res.json()),
            fetch("/locales/en.json").then((res) => res.json()),
            fetch("/locales/es.json").then((res) => res.json()),
        ]);
        translations = { fr, en, es };
        // Debug JSON content
        console.log("=== French JSON ===");
        console.table(fr);
        console.log("=== English JSON ===");
        console.table(en);
        console.log("=== Spanish JSON ===");
        console.table(es);
    }
    catch (err) {
        console.error("Error loading translations:", err);
    }
}
/**
 * Get translation by key
 */
export function t(key) {
    return translations[currentLanguage]?.[key] || key;
}
/**
 * Change language and update UI
 */
export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        console.log("===================== SELECTED LANGUAGE =====================");
        console.log(currentLanguage);
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
 * Update all elements with data-i18n attribute
 */
export function updateUI() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (key && translations[currentLanguage][key]) {
            // Si c’est un champ de saisie → on met la traduction dans placeholder
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                el.placeholder = translations[currentLanguage][key];
            }
            else {
                el.textContent = translations[currentLanguage][key];
            }
        }
    });
    const select = document.getElementById("language-select");
    if (select)
        select.value = currentLanguage;
}
/**
 * Initialize i18n system
 */
export async function initI18n() {
    // Load translation files
    await loadTranslations();
    console.log("===================== initI18n =====================");
    // Set saved language from localStorage if exists
    const savedLang = localStorage.getItem("lang");
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
    }
    // Listen for select changes
    const select = document.getElementById("language-select");
    if (select) {
        select.addEventListener("change", (e) => {
            const target = e.target;
            console.log("===================== LANGUAGE CHANGED =====================");
            console.log(target.value);
            setLanguage(target.value);
        });
    }
    // Apply translations to the page
    updateUI();
}
