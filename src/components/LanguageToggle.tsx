import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

/**
 * A small pill button to switch between Hebrew and English.
 * Renders "EN" when in Hebrew mode and "עב" when in English mode.
 */
export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "he" ? "en" : "he")}
      className={`text-xs font-bold px-2.5 h-8 rounded-full border border-border/50 hover:bg-muted ${className ?? ""}`}
      aria-label={lang === "he" ? "Switch to English" : "החלף לעברית"}
    >
      {lang === "he" ? "EN" : "עב"}
    </Button>
  );
}
