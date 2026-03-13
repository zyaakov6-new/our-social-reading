import { BookOpen, Home, Trophy, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/", label: "בית", icon: Home },
  { path: "/books", label: "ספרים", icon: BookOpen },
  { path: "/challenges", label: "אתגרים", icon: Trophy },
  { path: "/profile", label: "פרופיל", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-md items-center justify-around py-3">
        {/* Subtle circular "cutout" to cradle the central play button */}
        <div className="pointer-events-none absolute -top-6 left-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.08)]" />
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-xs transition-all ${
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
    </nav>
  );
};

export default BottomNav;
