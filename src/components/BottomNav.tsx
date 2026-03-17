import { BookOpen, Home, User, MessageSquare, Trophy, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// 6 tabs: 3 left + FAB spacer + 3 right — perfectly symmetric, FAB stays centered
const leftTabs = [
  { path: "/", label: "בית", icon: Home },
  { path: "/posts", label: "פורום", icon: MessageSquare },
  { path: "/friends", label: "חברים", icon: Users },
];

const rightTabs = [
  { path: "/challenges", label: "אתגרים", icon: Trophy },
  { path: "/books", label: "ספרים", icon: BookOpen },
  { path: "/profile", label: "פרופיל", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("addressee_id", user.id)
        .eq("status", "pending");
      setPendingCount(count ?? 0);
    };
    load();

    const channel = supabase
      .channel("nav_friendships_badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/97 backdrop-blur-md"
      style={{
        borderTop: '1px solid hsl(44 12% 74%)',
        boxShadow: '0 -4px 20px -4px hsl(126 15% 15% / 0.12), 0 -1px 4px -1px hsl(210 11% 14% / 0.06)',
      }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {leftTabs.map(tab => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          const showBadge = tab.path === "/friends" && pendingCount > 0;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 pt-2 pb-3 transition-colors"
            >
              <span
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200"
                style={isActive
                  ? { background: 'hsl(126 15% 28%)', color: 'hsl(44 30% 93%)', boxShadow: '0 2px 8px hsl(126 15% 15% / 0.25)' }
                  : { color: 'hsl(210 8% 58%)' }
                }
              >
                <Icon size={19} strokeWidth={isActive ? 2 : 1.5} />
                {showBadge && (
                  <span
                    className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card"
                    style={{ background: 'hsl(0 72% 51%)' }}
                  />
                )}
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-normal'}`}>{tab.label}</span>
              </span>
            </button>
          );
        })}

        {/* Spacer under central FAB */}
        <div className="w-16 flex-shrink-0" aria-hidden="true" />

        {rightTabs.map(tab => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1 pt-2 pb-3 transition-colors"
            >
              <span
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200"
                style={isActive
                  ? { background: 'hsl(126 15% 28%)', color: 'hsl(44 30% 93%)', boxShadow: '0 2px 8px hsl(126 15% 15% / 0.25)' }
                  : { color: 'hsl(210 8% 58%)' }
                }
              >
                <Icon size={19} strokeWidth={isActive ? 2 : 1.5} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-normal'}`}>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
