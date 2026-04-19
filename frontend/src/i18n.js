import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// ✅ IMPORTANT: update this path based on your file location
import { T } from "./utils/translations"; // <-- CHANGE if needed

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: T.en },
    hi: { translation: T.hi },
    pa: { translation: T.pa },
    ta: { translation: T.ta },
    mr: { translation: T.mr },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;