import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import en from "@/i18n/en";
import he from "@/i18n/he";

export type Lang = "he" | "en";

const translations = { he, en } as const;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof he;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "he",
  setLang: () => {},
  t: he,
  dir: "rtl",
});

export const useLanguage = () => useContext(LanguageContext);

async function detectCountry(): Promise<string | null> {
  try {
    const res = await fetch("https://api.country.is/", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return data?.country ?? null;
  } catch {
    return null;
  }
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("amud_lang") as Lang | null;
    if (saved === "he" || saved === "en") return saved;
    return "he"; // default while we detect
  });

  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("amud_lang");
    if (saved === "he" || saved === "en") {
      setDetected(true);
      return;
    }
    // No saved preference — detect by IP
    detectCountry().then(country => {
      const detected: Lang = country === "IL" ? "he" : "en";
      setLangState(detected);
      setDetected(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    localStorage.setItem("amud_lang", l);
    setLangState(l);
  };

  const t = translations[lang] as typeof he;
  const dir = lang === "he" ? "rtl" : "ltr";

  if (!detected) return null; // wait for detection before rendering to avoid flash

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};
