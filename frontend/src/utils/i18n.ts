// src/utils/i18n.ts
type Translations = { [key: string]: string };
type LocaleMap = { [lang: string]: Translations };

let translations: LocaleMap = {};
let currentLanguage: string = "fr";

/**
 * Load JSON translation files dynamically
 */
export async function loadTranslations() {
  try {
    const [fr, en, es] = await Promise.all([
      fetch("/locales/fr.json").then(res => res.json()),
      fetch("/locales/en.json").then(res => res.json()),
      fetch("/locales/es.json").then(res => res.json()),
    ]);
    translations = { fr, en, es };

    // Debug
    console.log("=== French JSON ===");
    console.table(fr);
    console.log("=== English JSON ===");
    console.table(en);
    console.log("=== Spanish JSON ===");
    console.table(es);
  } catch (err) {
    console.error("Error loading translations:", err);
  }
}

/**
 * Get translation by key
 */
export function t(key: string): string {
  return translations[currentLanguage]?.[key] || key;
}

/**
 * Change language and update UI
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
export function getLanguage(): string {
  return currentLanguage;
}

/**
 * Update all elements with data-i18n or data-winner
 */
export function updateUI() {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key && translations[currentLanguage][key]) {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.placeholder = translations[currentLanguage][key];
      } else {
        el.textContent = translations[currentLanguage][key];
      }
    }
  });

  document.querySelectorAll<HTMLElement>("[data-winner]").forEach(el => {
    const winner = el.getAttribute("data-winner");
    const winText = translations[currentLanguage]["1vs1_WinText"] || "gagne la partie !";
    if (winner) {
      el.textContent = `☆ ${winner} ${winText} ☆`;
    }
  });

  // Met à jour la valeur du select si présent
  const select = document.getElementById("language-select") as HTMLSelectElement;
  if (select) select.value = currentLanguage;
}

/**
 * Attach listener to language selector
 * Call this whenever the select may be recreated (e.g., after login)
 */
export function attachLanguageSelector() {
  const select = document.getElementById("language-select") as HTMLSelectElement;
  if (select) {
    select.value = currentLanguage;
    select.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      setLanguage(target.value);
    });
  }
}

/**
 * Initialize i18n system
 * Call this once on page load
 */
export async function initI18n() {
  await loadTranslations();

  const savedLang = localStorage.getItem("lang");
  if (savedLang && translations[savedLang]) {
    currentLanguage = savedLang;
  }

  updateUI();
  attachLanguageSelector();
}

