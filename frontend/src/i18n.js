import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Імпорт ресурсів перекладів
import translationUk from "./locales/uk";
import translationEn from "./locales/en";
import translationDe from "./locales/de";
import translationEs from "./locales/es";
import translationFr from "./locales/fr";

const resources = {
  uk: translationUk,
  en: translationEn,
  de: translationDe,
  es: translationEs,
  fr: translationFr
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "uk",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;