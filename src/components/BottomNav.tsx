import { BookOpen, Home, User, MessageSquare } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

// 4 tabs (2 left + FAB spacer + 2 right) keeps the FAB perfectly centered
const tabs = [
  { path: "/", label: "בית", icon: Home },
  { path: "/posts", label: "פורום", icon: MessageSquare },
  { path: "/books", label: "ספרים", icon: BookOpen },
  { path: "/profile", label: "פרופיל", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/97 backdrop-blur-md"
      style={{ borderTop: '1px solid hsl(44 12% 74%)' }}>
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {tabs.slice(0, 2).map(tab => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 flex-1 pt-3 pb-4 text-xs transition-colors"
              style={{ color: isActive ? 'hsl(126 15% 28%)' : 'hsl(210 8% 52%)' }}
            >
              {/* Active indicator: thin top bar */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px bg-primary" />
              )}
              <Icon size={20} strokeWidth={1.5} />
              <span className={isActive ? "font-semibold" : "font-normal"}>{tab.label}</span>
            </button>
          );
        })}

        {/* Spacer under central FAB */}
        <div className="w-16 flex-shrink-0" aria-hidden="true" />

        {tabs.slice(2).map(tab => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 flex-1 pt-3 pb-4 text-xs transition-colors"
              style={{ color: isActive ? 'hsl(126 15% 28%)' : 'hsl(210 8% 52%)' }}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px bg-primary" />
              )}
              <Icon size={20} strokeWidth={1.5} />
              <span className={isActive ? "font-semibold" : "font-normal"}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
