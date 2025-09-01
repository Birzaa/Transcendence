// src/utils/i18n.ts
import { translations } from "./translations";
let currentLang = "fr"; // langue par défaut
export function t(key) {
    return translations[currentLang][key] || key;
}
export function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
    }
    else {
        console.warn(`Langue "${lang}" non supportée, utilisation de ${currentLang}`);
    }
}
export function getLanguage() {
    return currentLang;
}
