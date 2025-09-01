// src/utils/i18n.ts
import { translations } from "./translations";

let currentLang: keyof typeof translations = "fr"; // langue par défaut

export function t(key: string): string {
  return translations[currentLang][key] || key;
}

export function setLanguage(lang: string) {
  if (translations[lang]) {
    currentLang = lang as keyof typeof translations;
  } else {
    console.warn(`Langue "${lang}" non supportée, utilisation de ${currentLang}`);
  }
}

export function getLanguage(): string {
  return currentLang;
}
