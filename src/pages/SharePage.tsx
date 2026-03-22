import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ShareStats {
  displayName: string;
  avatarUrl?: string;
  booksThisMonth: number;
  pagesThisMonth: number;
  streak: number;
}

const SharePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ShareStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isOwnCard = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      const displayName = profile?.display_name || "קורא";

      // Fetch sessions — only possible if authenticated (own card or friend)
      let booksThisMonth = 0;
      let pagesThisMonth = 0;
      let streak = 0;

      if (user) {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        const { data: sessions } = await supabase
          .from("reading_sessions")
          .select("book_id, pages_read, session_date")
          .eq("user_id", userId)
          .gte("session_date", monthAgo.toISOString().split("T")[0]);

        if (sessions) {
          const uniqueBooks = new Set(sessions.map(s => s.book_id));
          booksThisMonth = uniqueBooks.size;
          pagesThisMonth = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);
        }

        // Streak — own card only (needs all sessions)
        if (isOwnCard) {
          const { data: allSessions } = await supabase
            .from("reading_sessions")
            .select("session_date")
            .eq("user_id", userId)
            .order("session_date", { ascending: false });

          if (allSessions) {
            const uniqueDates = [...new Set(allSessions.map(s =>
              s.session_date.substring(0, 10)
            ))].sort().reverse();

            const now = new Date();
            const toLocalDate = (d: Date) =>
              `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

            const today = toLocalDate(now);
            const yesterday = toLocalDate(new Date(now.getTime() - 86_400_000));

            if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
              for (let i = 0; i < uniqueDates.length; i++) {
                const expected = toLocalDate(new Date(now.getTime() - i * 86_400_000));
                if (uniqueDates.includes(expected)) streak++;
                else break;
              }
            }
          }
        }
      }

      setStats({ displayName, avatarUrl: profile?.avatar_url, booksThisMonth, pagesThisMonth, streak });
      setLoading(false);
    };
    load();
  }, [userId, user, isOwnCard]);

  const shareUrl = `${window.location.origin}/join?ref=${userId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `היי! אני משתמש ב-AMUD - אפליקציה לקריאה חברתית. הצטרף אליי 📚 ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleNativeShare = () => {
    if (!stats) return;
    const text = `אני קורא ב-AMUD 📚`;
    if (navigator.share) {
      navigator.share({ title: "AMUD - עמוד", text, url: shareUrl });
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-full reading-gradient animate-pulse" />
      </div>
    );
  }

  const initial = stats?.displayName.charAt(0).toUpperCase() || "?";

  return (
    <div dir="rtl" style={{ minHeight: "100svh", background: "#1A2319", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.25rem", gap: "1.5rem" }}>

      {/* ── THE CARD ─────────────────────────────────────────────── */}
      <div style={{
        width: "100%",
        maxWidth: 360,
        background: "linear-gradient(145deg, #243325 0%, #1A2319 60%, #1c2e2d 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: "2.25rem 2rem",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* decorative rings */}
        {[260, 420].map(s => (
          <div key={s} aria-hidden style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: s, height: s,
            border: "1px solid rgba(255,255,255,0.03)",
            borderRadius: "50%", pointerEvents: "none",
          }} />
        ))}

        {/* AMUD wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.75rem" }}>
          <img src="/logo.png" alt="AMUD" style={{ width: 22, height: 22, objectFit: "contain", opacity: 0.8 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 900, fontStyle: "italic",
            fontSize: "1rem", letterSpacing: "0.08em",
            color: "rgba(237,231,217,0.5)",
          }}>AMUD</span>
        </div>

        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "2rem" }}>
          {stats?.avatarUrl ? (
            <img src={stats.avatarUrl} alt={stats.displayName}
              style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#3C513E",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Heebo', sans-serif", fontWeight: 700,
              fontSize: "1.4rem", color: "#EDE7D9",
              border: "2px solid rgba(255,255,255,0.08)",
            }}>{initial}</div>
          )}
          <div>
            <p style={{ fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 700, fontSize: "1.3rem", color: "#EDE7D9", lineHeight: 1.2 }}>
              {stats?.displayName}
            </p>
            <p style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.75rem", color: "rgba(237,231,217,0.45)", marginTop: 2 }}>
              קורא ב-AMUD
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "1.75rem" }} />

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: "2rem" }}>
          {[
            { value: stats?.booksThisMonth ?? 0, label: "ספרים", icon: "📚" },
            { value: stats?.pagesThisMonth ?? 0, label: "עמודים", icon: "📄" },
            { value: stats?.streak ?? 0, label: "ימי רצף", icon: "🔥" },
          ].map(({ value, label, icon }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12, padding: "0.85rem 0.5rem",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.1rem", marginBottom: 3 }}>{icon}</div>
              <div style={{
                fontFamily: "'Frank Ruhl Libre', serif", fontWeight: 900,
                fontSize: "1.5rem", color: "#E08E45", lineHeight: 1,
              }}>{value}</div>
              <div style={{ fontFamily: "'Heebo', sans-serif", fontSize: "0.65rem", color: "rgba(237,231,217,0.4)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div style={{
          textAlign: "center",
          fontFamily: "'Heebo', sans-serif", fontSize: "0.78rem",
          color: "rgba(237,231,217,0.35)",
          letterSpacing: "0.04em",
        }}>
          amud.app
        </div>
      </div>

      {/* ── ACTION BUTTONS ───────────────────────────────────────── */}
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 10 }}>

        {isOwnCard && (
          <>
            <button onClick={handleNativeShare} style={{
              background: "#E08E45", color: "#fff", border: "none",
              borderRadius: 10, padding: "14px 0",
              fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: "0.95rem",
              cursor: "pointer", width: "100%",
            }}>
              שתף את הכרטיס שלי ←
            </button>

            <button onClick={handleWhatsApp} style={{
              background: "#25D366", color: "#fff", border: "none",
              borderRadius: 10, padding: "14px 0",
              fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: "0.95rem",
              cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              שלח לחבר בוואטסאפ
            </button>

            <button onClick={handleCopy} style={{
              background: "rgba(255,255,255,0.06)", color: "#EDE7D9",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "14px 0",
              fontFamily: "'Heebo', sans-serif", fontWeight: 600, fontSize: "0.9rem",
              cursor: "pointer", width: "100%",
            }}>
              {copied ? "✓ הקישור הועתק!" : "העתק קישור להזמנה"}
            </button>
          </>
        )}

        {!isOwnCard && (
          <button onClick={() => navigate(`/join?ref=${userId}`)} style={{
            background: "#E08E45", color: "#fff", border: "none",
            borderRadius: 10, padding: "15px 0",
            fontFamily: "'Heebo', sans-serif", fontWeight: 700, fontSize: "1rem",
            cursor: "pointer", width: "100%",
          }}>
            הצטרף ל-AMUD חינם ←
          </button>
        )}

        <button onClick={() => navigate(user ? "/" : "/auth")} style={{
          background: "transparent", color: "rgba(237,231,217,0.45)",
          border: "none", padding: "10px 0",
          fontFamily: "'Heebo', sans-serif", fontSize: "0.8rem",
          cursor: "pointer", width: "100%",
        }}>
          {user ? "← חזרה לאפליקציה" : "כבר יש לי חשבון - כניסה"}
        </button>
      </div>
    </div>
  );
};

export default SharePage;
