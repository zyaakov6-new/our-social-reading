import { Home, Trophy, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useState } from "react";
import UpgradeModal from "./UpgradeModal";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isPro, isLoading } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname === path;

  const NavBtn = ({
    path,
    label,
    icon: Icon,
  }: {
    path: string;
    label: string;
    icon: React.ElementType;
  }) => {
    const active = isActive(path);
    return (
      <button
        onClick={() => navigate(path)}
        className="flex flex-col items-center justify-center flex-1 pt-2 pb-3 min-h-[44px] transition-colors touch-manipulation"
      >
        <span
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 relative"
          style={
            active
              ? {
                  background: "hsl(126 15% 28%)",
                  color: "hsl(44 30% 93%)",
                  boxShadow: "0 2px 8px hsl(126 15% 15% / 0.25)",
                }
              : { color: "hsl(210 8% 58%)" }
          }
        >
          <span className="relative">
            <Icon size={20} strokeWidth={active ? 2 : 1.5} />
          </span>
          <span className={`text-[10px] ${active ? "font-bold" : "font-normal"}`}>
            {label}
          </span>
        </span>
      </button>
    );
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/97 backdrop-blur-md"
        style={{
          borderTop: "1px solid hsl(44 12% 74%)",
          boxShadow:
            "0 -4px 20px -4px hsl(126 15% 15% / 0.12), 0 -1px 4px -1px hsl(210 11% 14% / 0.06)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* PRO upgrade strip — visible for free logged-in users */}
        {!isLoading && !isPro && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-1.5 transition-opacity hover:opacity-80"
            style={{
              background: "linear-gradient(90deg, hsl(126 15% 22%) 0%, hsl(126 22% 32%) 50%, hsl(126 15% 22%) 100%)",
              borderBottom: "1px solid hsl(126 15% 18%)",
            }}
          >
            <Sparkles size={11} style={{ color: "hsl(44 70% 65%)" }} />
            <span
              className="text-[11px] font-bold tracking-wide"
              style={{ color: "hsl(44 30% 88%)" }}
            >
              {t.subscription.upgradeCta}
            </span>
            <span
              className="text-[9px] font-extrabold tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ background: "hsl(44 70% 55%)", color: "hsl(126 15% 15%)" }}
            >
              PRO
            </span>
          </button>
        )}

        {/* DOM order: Home | spacer | Challenges */}
        <div className="mx-auto flex max-w-md items-stretch">
          <NavBtn path="/" label={t.nav.home} icon={Home} />
          <div className="w-20 flex-shrink-0" aria-hidden="true" />
          <NavBtn path="/challenges" label={t.nav.challenges} icon={Trophy} />
        </div>
      </nav>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
};

export default BottomNav;
