import { Home, Trophy } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

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
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/97 backdrop-blur-md"
      style={{
        borderTop: "1px solid hsl(44 12% 74%)",
        boxShadow:
          "0 -4px 20px -4px hsl(126 15% 15% / 0.12), 0 -1px 4px -1px hsl(210 11% 14% / 0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* DOM order: Home | spacer | Challenges */}
      <div className="mx-auto flex max-w-md items-stretch">
        {/* Home - visually far right */}
        <NavBtn path="/" label={t.nav.home} icon={Home} />

        {/* Spacer under the central FAB button */}
        <div className="w-20 flex-shrink-0" aria-hidden="true" />

        {/* Challenges */}
        <NavBtn path="/challenges" label={t.nav.challenges} icon={Trophy} />
      </div>
    </nav>
  );
};

export default BottomNav;
