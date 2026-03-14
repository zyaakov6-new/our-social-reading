import { BookOpen, Home, Trophy, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/", label: "בית", icon: Home },
  { path: "/challenges", label: "אתגרים", icon: Trophy },
  { path: "/books", label: "ספרים", icon: BookOpen },
  { path: "/profile", label: "פרופיל", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          {tabs.slice(0, 2).map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-xs transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={21} strokeWidth={isActive ? 2.3 : 1.7} />
                <span className={`${isActive ? "font-semibold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Spacer under central play button so it doesn't overlap nav items */}
        <div className="w-16" aria-hidden="true" />

        <div className="flex items-center gap-6">
          {tabs.slice(2).map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-xs transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={21} strokeWidth={isActive ? 2.3 : 1.7} />
                <span className={`${isActive ? "font-semibold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
