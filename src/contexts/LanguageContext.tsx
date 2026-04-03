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
  // Primary: Cloudflare trace — always available, no CORS, ~1ms
  try {
    const res = await fetch("https://cloudflare.com/cdn-cgi/trace", { signal: AbortSignal.timeout(2000) });
    const text = await res.text();
    const match = text.match(/^loc=(.+)$/m);
    if (match?.[1]) return match[1].trim();
  } catch { /* fall through */ }

  // Fallback: api.country.is
  try {
    const res = await fetch("https://api.country.is/", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data?.country) return data.country;
  } catch { /* fall through */ }

  return null;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("amud_lang") as Lang | null;
    if (saved === "he" || saved === "en") return saved;
    return "he"; // default while detecting
  });

  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("amud_lang");
    const detectedBefore = localStorage.getItem("amud_lang_detected");
    // If user explicitly toggled the language manually, respect it
    if ((saved === "he" || saved === "en") && detectedBefore === "1") {
      setDetected(true);
      return;
    }
    // First visit or detection was never properly run — detect by IP
    // Default to "he" if detection fails (Israeli-first app)
    detectCountry().then(country => {
      const lang: Lang = (country && country !== "IL") ? "en" : "he";
      setLangState(lang);
      localStorage.setItem("amud_lang", lang);
      localStorage.setItem("amud_lang_detected", "1");
      setDetected(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    localStorage.setItem("amud_lang", l);
    localStorage.setItem("amud_lang_detected", "1"); // mark as user-chosen
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
