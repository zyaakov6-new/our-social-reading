import { Home, Trophy, Menu, X, BookOpen, MessageSquare, Users, LogOut, Share2, UserPlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import InviteModal from "./InviteModal";
import { useStreak } from "@/hooks/useStreak";

const authLinks = [
  { path: "/",           label: "בית",    icon: Home,          desc: "עמוד הבית" },
  { path: "/challenges", label: "אתגרים", icon: Trophy,         desc: "אתגרי קריאה" },
  { path: "/posts",      label: "פורום",  icon: MessageSquare,  desc: "שיחות ודיונים" },
  { path: "/friends",    label: "חברים",  icon: Users,          desc: "חברים ודירוג" },
  { path: "/books",      label: "ספרים",  icon: BookOpen,       desc: "ספריית הספרים" },
];

const guestLinks = [
  { path: "/feed",       label: "פיד",    icon: Home,   desc: "מה הקהילה קוראת" },
  { path: "/books",      label: "ספרים",  icon: BookOpen, desc: "ספריית הספרים" },
  { path: "/challenges", label: "אתגרים", icon: Trophy,  desc: "אתגרי קריאה" },
];

const HamburgerMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { streak } = useStreak();

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
      .channel("hamburger_badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Close on navigation
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const navTo = (path: string) => { navigate(path); setOpen(false); };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname === path;

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "קורא";
  const initial = displayName.charAt(0).toUpperCase();
  const links = user ? authLinks : guestLinks;

  return (
    <>
      {/* ── Trigger button — fixed top-left ─────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed top-4 left-4 z-50 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md"
        style={{
          background: open ? "hsl(126 15% 28%)" : "hsl(44 27% 84% / 0.92)",
          border: "1px solid hsl(44 12% 72%)",
          color: open ? "hsl(44 30% 93%)" : "hsl(210 8% 40%)",
          backdropFilter: "blur(8px)",
        }}
        aria-label="תפריט ניווט"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={18} strokeWidth={2} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} className="relative">
              <Menu size={18} strokeWidth={1.8} />
              {pendingCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 h-2 w-2 rounded-full"
                  style={{ background: "hsl(0 72% 51%)" }}
                />
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Backdrop + drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />

            {/* Side drawer — slides in from the left */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col overflow-hidden"
              style={{
                background: "hsl(44 28% 86%)",
                borderRight: "1px solid hsl(44 15% 76%)",
                boxShadow: "4px 0 24px hsl(126 15% 10% / 0.14)",
              }}
            >
              {/* Header */}
              {user ? (
                <button
                  onClick={() => navTo("/profile")}
                  className="flex items-center gap-3 px-5 pt-12 pb-5 w-full text-right hover:bg-black/5 transition-colors"
                  style={{ borderBottom: "1px solid hsl(44 12% 76%)" }}
                >
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg text-white shadow-md overflow-hidden"
                    style={{ background: "hsl(126 15% 28%)" }}
                  >
                    {initial}
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">{displayName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground">הצג פרופיל ←</p>
                      {streak > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: "hsl(28 71% 57%)" }}>
                          🔥{streak}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ) : (
                <div className="px-5 pt-12 pb-5" style={{ borderBottom: "1px solid hsl(44 12% 76%)" }}>
                  <p className="font-display text-2xl tracking-widest mb-0.5">AMUD</p>
                  <p className="text-xs text-muted-foreground">פלטפורמת הקריאה החברתית</p>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {links.map(({ path, label, icon: Icon, desc }) => {
                  const active = isActive(path);
                  const showBadge = path === "/friends" && pendingCount > 0;
                  return (
                    <button
                      key={path}
                      onClick={() => navTo(path)}
                      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-right transition-all duration-150"
                      style={
                        active
                          ? {
                              background: "hsl(126 15% 28%)",
                              color: "hsl(44 30% 93%)",
                              boxShadow: "0 2px 8px hsl(126 15% 15% / 0.2)",
                            }
                          : {
                              background: "transparent",
                              color: "hsl(210 8% 30%)",
                            }
                      }
                      onMouseEnter={e => {
                        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "hsl(44 20% 80%)";
                      }}
                      onMouseLeave={e => {
                        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <span className="relative flex-shrink-0">
                        <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                        {showBadge && (
                          <span
                            className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2"
                            style={{
                              background: "hsl(0 72% 51%)",
                              borderColor: active ? "hsl(126 15% 28%)" : "hsl(44 28% 86%)",
                            }}
                          />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight ${active ? "font-bold" : "font-medium"}`}>{label}</p>
                        <p className={`text-[11px] mt-0.5 ${active ? "opacity-70" : "text-muted-foreground"}`}>{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Footer */}
              {user ? (
                <>
                  {/* Invite friends */}
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => { setInviteOpen(true); setOpen(false); }}
                      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-right font-medium text-sm transition-all"
                      style={{
                        background: "hsl(28 71% 57% / 0.1)",
                        color: "hsl(28 71% 45%)",
                        border: "1px solid hsl(28 71% 57% / 0.2)",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(28 71% 57% / 0.18)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(28 71% 57% / 0.1)"; }}
                    >
                      <Share2 size={18} strokeWidth={1.8} />
                      <div className="text-right">
                        <p className="text-sm font-bold">הזמן חברים</p>
                        <p className="text-[11px] opacity-70">שתף קישור ייחודי</p>
                      </div>
                    </button>
                  </div>

                  {/* Sign out */}
                  <div className="px-3 py-4" style={{ borderTop: "1px solid hsl(44 12% 76%)" }}>
                    <button
                      onClick={async () => { setOpen(false); await signOut(); }}
                      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-right transition-all"
                      style={{ color: "hsl(0 60% 44%)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(0 80% 96%)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <LogOut size={20} strokeWidth={1.5} />
                      <div className="text-right">
                        <p className="text-sm font-medium">יציאה</p>
                        <p className="text-[11px] text-muted-foreground">התנתקות מהחשבון</p>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-3 py-4 space-y-2" style={{ borderTop: "1px solid hsl(44 12% 76%)" }}>
                  <button
                    onClick={() => { setOpen(false); navigate("/auth"); }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-sm text-white transition-opacity hover:opacity-90"
                    style={{ background: "hsl(126 15% 28%)" }}
                  >
                    <UserPlus size={16} strokeWidth={2} />
                    הצטרף בחינם
                  </button>
                  <button
                    onClick={() => { setOpen(false); navigate("/auth"); }}
                    className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                  >
                    כבר רשום? התחבר
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
};

export default HamburgerMenu;
