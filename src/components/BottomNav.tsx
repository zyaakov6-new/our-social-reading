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
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/97 backdrop-blur-md"
      style={{
        borderTop: '1px solid hsl(44 12% 74%)',
        boxShadow: '0 -4px 20px -4px hsl(126 15% 15% / 0.12), 0 -1px 4px -1px hsl(210 11% 14% / 0.06)',
      }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {tabs.slice(0, 2).map(tab => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 pt-2 pb-3 text-xs transition-colors"
            >
              <span
                className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200"
                style={isActive
                  ? { background: 'hsl(126 15% 28%)', color: 'hsl(44 30% 93%)', boxShadow: '0 2px 8px hsl(126 15% 15% / 0.25)' }
                  : { color: 'hsl(210 8% 58%)' }
                }
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-normal'}`}>{tab.label}</span>
              </span>
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
              className="flex flex-col items-center justify-center flex-1 pt-2 pb-3 text-xs transition-colors"
            >
              <span
                className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-200"
                style={isActive
                  ? { background: 'hsl(126 15% 28%)', color: 'hsl(44 30% 93%)', boxShadow: '0 2px 8px hsl(126 15% 15% / 0.25)' }
                  : { color: 'hsl(210 8% 58%)' }
                }
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-normal'}`}>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
