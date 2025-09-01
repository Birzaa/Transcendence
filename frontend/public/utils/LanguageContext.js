// frontend/utils/LanguageContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import translations from "./translations";
const LanguageContext = createContext(undefined);
export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState("en");
    // Charger la langue depuis le localStorage
    useEffect(() => {
        const savedLang = localStorage.getItem("language");
        if (savedLang)
            setLanguage(savedLang);
    }, []);
    const changeLanguage = (lang) => {
        setLanguage(lang);
        localStorage.setItem("language", lang);
    };
    const t = (key) => translations[language][key] || key;
    return (<LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>);
};
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context)
        throw new Error("useLanguage must be used within a LanguageProvider");
    return context;
};
