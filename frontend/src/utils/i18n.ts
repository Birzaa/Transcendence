// src/utils/i18n.ts
type Translations = { [key: string]: string };
type LocaleMap = { [lang: string]: Translations };

let translations: LocaleMap = {};
let currentLanguage: string = "fr";

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
export function t(key: string): string {
  return translations[currentLanguage]?.[key] || key;
}

/**
 * Change language
 */
export function setLanguage(lang: string) {
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
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key && translations[currentLanguage][key]) {
      el.textContent = translations[currentLanguage][key];
    }
  });

  const select = document.getElementById("language-select") as HTMLSelectElement;
  if (select) select.value = currentLanguage;
}

/**
 * Initialize i18n
 */
export function initI18n() {
  const savedLang = localStorage.getItem("lang");
  if (savedLang && translations[savedLang]) currentLanguage = savedLang;

  const select = document.getElementById("language-select") as HTMLSelectElement;
  if (select) {
    select.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      setLanguage(target.value);
    });
  }

  updateUI();
}
