import { Home, Trophy, Menu, X, BookOpen, User, MessageSquare, Users, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const allLinks = [
  { path: "/",          label: "בית",     icon: Home,         group: "main" },
  { path: "/challenges",label: "אתגרים",  icon: Trophy,       group: "main" },
  { path: "/posts",     label: "פורום",   icon: MessageSquare, group: "social" },
  { path: "/friends",   label: "חברים",   icon: Users,         group: "social" },
  { path: "/books",     label: "ספרים",   icon: BookOpen,      group: "library" },
  { path: "/profile",   label: "פרופיל",  icon: User,          group: "library" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close menu on navigation
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navTo = (path: string) => { navigate(path); setMenuOpen(false); };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname === path;

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "קורא";
  const initial = displayName.charAt(0).toUpperCase();

  const NavBtn = ({ path, label, icon: Icon }: { path: string; label: string; icon: React.ElementType }) => {
    const active = isActive(path);
    return (
      <button
        onClick={() => navTo(path)}
        className="flex flex-col items-center justify-center flex-1 pt-2 pb-3 transition-colors"
      >
        <span
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200"
          style={
            active
              ? { background: "hsl(126 15% 28%)", color: "hsl(44 30% 93%)", boxShadow: "0 2px 8px hsl(126 15% 15% / 0.25)" }
              : { color: "hsl(210 8% 58%)" }
          }
        >
          <Icon size={19} strokeWidth={active ? 2 : 1.5} />
          <span className={`text-[10px] ${active ? "font-bold" : "font-normal"}`}>{label}</span>
        </span>
      </button>
    );
  };

  return (
    <>
      {/* ── Bottom bar ──────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/97 backdrop-blur-md"
        style={{
          borderTop: "1px solid hsl(44 12% 74%)",
          boxShadow: "0 -4px 20px -4px hsl(126 15% 15% / 0.12), 0 -1px 4px -1px hsl(210 11% 14% / 0.06)",
        }}
      >
        {/* Code order (RTL reverses visually): Home | spacer | Challenges | Menu */}
        {/* Visual result:                       Menu | Challenges | FAB | Home  */}
        <div className="mx-auto flex max-w-md items-stretch">

          {/* Home — visually far right */}
          <NavBtn path="/" label="בית" icon={Home} />

          {/* FAB spacer — center */}
          <div className="w-16 flex-shrink-0" aria-hidden="true" />

          {/* Challenges */}
          <NavBtn path="/challenges" label="אתגרים" icon={Trophy} />

          {/* Hamburger — visually far left */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex flex-col items-center justify-center flex-1 pt-2 pb-3 transition-colors"
          >
            <span
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200"
              style={
                menuOpen
                  ? { background: "hsl(126 15% 28%)", color: "hsl(44 30% 93%)", boxShadow: "0 2px 8px hsl(126 15% 15% / 0.25)" }
                  : { color: "hsl(210 8% 58%)" }
              }
            >
              {menuOpen ? <X size={19} strokeWidth={2} /> : <Menu size={19} strokeWidth={1.5} />}
              {!menuOpen && pendingCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card"
                  style={{ background: "hsl(0 72% 51%)" }}
                />
              )}
              <span className={`text-[10px] ${menuOpen ? "font-bold" : "font-normal"}`}>תפריט</span>
            </span>
          </button>
        </div>
      </nav>

      {/* ── Hamburger slide-up sheet ────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute bottom-16 left-0 right-0 max-w-md mx-auto rounded-t-3xl overflow-hidden"
              style={{ background: "hsl(44 27% 88%)", borderTop: "1px solid hsl(44 15% 78%)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* User badge */}
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderBottom: "1px solid hsl(44 12% 76%)" }}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-base text-white"
                  style={{ background: "hsl(126 15% 28%)" }}
                >
                  {initial}
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              {/* Nav links — 2-column grid */}
              <div className="px-4 pt-3 pb-2 grid grid-cols-2 gap-2">
                {allLinks.map(({ path, label, icon: Icon }) => {
                  const active = isActive(path);
                  const showBadge = path === "/friends" && pendingCount > 0;
                  return (
                    <button
                      key={path}
                      onClick={() => navTo(path)}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all text-right"
                      style={
                        active
                          ? { background: "hsl(126 15% 28%)", color: "hsl(44 30% 93%)" }
                          : { background: "hsl(44 20% 82%)", color: "hsl(210 8% 35%)" }
                      }
                    >
                      <span className="relative flex-shrink-0">
                        <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                        {showBadge && (
                          <span
                            className="absolute -top-1 -right-1 h-2 w-2 rounded-full"
                            style={{ background: "hsl(0 72% 51%)" }}
                          />
                        )}
                      </span>
                      <span className={`text-sm flex-1 ${active ? "font-bold" : "font-medium"}`}>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sign out */}
              <div className="px-4 pb-5 pt-1">
                <button
                  onClick={async () => { setMenuOpen(false); await signOut(); }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium transition-colors"
                  style={{ background: "hsl(44 20% 82%)", color: "hsl(0 60% 45%)" }}
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  <span>יציאה</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomNav;
