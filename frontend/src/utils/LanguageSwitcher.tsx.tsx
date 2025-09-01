import { setLanguage, getLanguage } from "./i18n";

export function LanguageSwitcher() {
  const container = document.createElement("div");

  const select = document.createElement("select");
  select.value = getLanguage();

  ["en", "fr", "es"].forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang;
    option.textContent = lang.toUpperCase();
    select.appendChild(option);
  });

  select.addEventListener("change", (e) => {
    const newLang = (e.target as HTMLSelectElement).value;
    setLanguage(newLang);
    window.location.reload(); // recharge pour appliquer la langue
  });

  container.appendChild(select);
  return container;
}
