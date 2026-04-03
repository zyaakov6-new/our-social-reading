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

const getInitialLanguage = (): Lang => {
  const saved = localStorage.getItem("amud_lang");
  if (saved === "he" || saved === "en") return saved;

  const locale = navigator.language.toLowerCase();
  return locale.startsWith("he") || locale.includes("-il") ? "he" : "en";
};

async function detectCountry(): Promise<string | null> {
  try {
    const res = await fetch("https://cloudflare.com/cdn-cgi/trace", { signal: AbortSignal.timeout(2000) });
    const text = await res.text();
    const match = text.match(/^loc=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  } catch {
    // Fall through to the backup detector.
  }

  try {
    const res = await fetch("https://api.country.is/", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data?.country) return data.country as string;
  } catch {
    // Keep the current language if geo detection fails.
  }

  return null;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(getInitialLanguage);

  useEffect(() => {
    const saved = localStorage.getItem("amud_lang");
    const detectedBefore = localStorage.getItem("amud_lang_detected");
    if ((saved === "he" || saved === "en") && detectedBefore === "1") {
      return;
    }

    let active = true;
    detectCountry().then((country) => {
      if (!active || !country) return;

      const nextLang: Lang = country === "IL" ? "he" : "en";
      setLangState(nextLang);
      localStorage.setItem("amud_lang", nextLang);
      localStorage.setItem("amud_lang_detected", "1");
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (nextLang: Lang) => {
    localStorage.setItem("amud_lang", nextLang);
    localStorage.setItem("amud_lang_detected", "1");
    setLangState(nextLang);
  };

  const t = translations[lang] as typeof he;
  const dir = lang === "he" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};
