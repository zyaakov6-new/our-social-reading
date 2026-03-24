import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, BookOpen } from "lucide-react";

interface ShareData {
  displayName: string;
  weekMinutes: number;
  books: string[];
  rank: number | null;
}

const MEDALS = ["🥇", "🥈", "🥉"];

const LeaderboardShare = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split("T")[0];

        const [profileRes, sessionsRes, booksRes, allSessionsRes] = await Promise.all([
          supabase.from("profiles").select("display_name").eq("user_id", userId).single(),
          supabase.from("reading_sessions").select("minutes_read").eq("user_id", userId).gte("session_date", weekAgoStr),
          supabase.from("books").select("title").eq("user_id", userId).eq("status", "reading").limit(2),
          supabase.from("reading_sessions").select("user_id, minutes_read").gte("session_date", weekAgoStr),
        ]);

        const weekMinutes = (sessionsRes.data || []).reduce(
          (sum: number, s: any) => sum + (s.minutes_read || 0), 0
        );

        // Calculate rank across all users this week
        const minutesMap: Record<string, number> = {};
        (allSessionsRes.data || []).forEach((s: any) => {
          minutesMap[s.user_id] = (minutesMap[s.user_id] || 0) + (s.minutes_read || 0);
        });
        const sorted = Object.entries(minutesMap).sort((a, b) => b[1] - a[1]);
        const rankIndex = sorted.findIndex(([id]) => id === userId);
        const rank = rankIndex >= 0 ? rankIndex + 1 : null;

        setData({
          displayName: profileRes.data?.display_name || "קורא",
          weekMinutes,
          books: (booksRes.data || []).map((b: any) => b.title),
          rank,
        });
      } catch (e) {
        console.error("LeaderboardShare error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(44 27% 93%)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "hsl(126 15% 28% / 0.2)", borderTopColor: "hsl(126 15% 28%)" }}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "hsl(44 27% 93%)" }}
      >
        <p className="text-muted-foreground">הדף לא נמצא</p>
        <button
          onClick={() => navigate("/")}
          className="text-sm font-semibold"
          style={{ color: "hsl(126 15% 28%)" }}
        >
          חזור לדף הבית
        </button>
      </div>
    );
  }

  const medal = data.rank && data.rank <= 3 ? MEDALS[data.rank - 1] : null;
  const isTopReader = data.rank === 1;

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "hsl(44 27% 93%)" }}
    >
      {/* The shareable card */}
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "hsl(44 30% 97%)",
          border: "1px solid hsl(44 15% 78%)",
          boxShadow: "0 12px 48px hsl(126 15% 28% / 0.14)",
        }}
      >
        {/* Card header */}
        <div
          className="px-6 pt-6 pb-5 text-center"
          style={{ background: "hsl(126 15% 28%)", color: "white" }}
        >
          <p className="font-display text-2xl tracking-[0.18em]">AMUD</p>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Trophy size={12} style={{ opacity: 0.7 }} />
            <p className="text-xs" style={{ opacity: 0.7 }}>לוח תוצאות שבועי</p>
          </div>
        </div>

        {/* Main content */}
        <div className="px-6 py-7 text-center space-y-5">

          {/* Rank / medal */}
          {medal ? (
            <div className="text-6xl leading-none">{medal}</div>
          ) : data.rank ? (
            <div
              className="text-4xl font-bold"
              style={{ color: "hsl(126 15% 28%)" }}
            >
              #{data.rank}
            </div>
          ) : (
            <div className="text-4xl"><BookOpen size={48} style={{ color: "hsl(126 15% 28%)", margin: "0 auto" }} /></div>
          )}

          {/* Name + status */}
          <div>
            <p className="font-bold text-2xl">{data.displayName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isTopReader
                ? "מוביל/ה את לוח התוצאות השבוע 🔥"
                : data.rank
                ? `מקום #${data.rank} בדירוג השבועי`
                : "קורא/ת פעיל/ה השבוע"}
            </p>
          </div>

          {/* Minutes stat */}
          <div
            className="rounded-2xl py-5 px-6"
            style={{
              background: "hsl(126 15% 28% / 0.07)",
              border: "1px solid hsl(126 15% 28% / 0.12)",
            }}
          >
            <p
              className="text-4xl font-bold"
              style={{ color: "hsl(126 15% 28%)" }}
            >
              {data.weekMinutes}
            </p>
            <p className="text-sm text-muted-foreground mt-1">דקות קריאה השבוע</p>
          </div>

          {/* Currently reading */}
          {data.books.length > 0 && (
            <div className="text-right space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">קורא/ת עכשיו:</p>
              {data.books.map(title => (
                <p
                  key={title}
                  className="text-sm font-medium truncate"
                  style={{ color: "hsl(188 60% 35%)" }}
                >
                  📖 {title}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Card footer CTA */}
        <div
          className="px-6 pb-7 pt-2 space-y-3"
          style={{ borderTop: "1px solid hsl(44 15% 82%)" }}
        >
          <p className="text-xs text-center text-muted-foreground pt-3">
            הצטרף/י לתחרות הקריאה השבועית ב-AMUD
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="w-full h-12 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: "hsl(126 15% 28%)", color: "white" }}
          >
            הצטרף/י בחינם ←
          </button>
          <button
            onClick={() => navigate("/feed")}
            className="w-full text-xs text-center font-medium transition-colors"
            style={{ color: "hsl(126 15% 28%)", opacity: 0.7 }}
          >
            גלה את האפליקציה קודם
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">amud.app · קריאה חברתית בעברית · בחינם לתמיד</p>
    </div>
  );
};

export default LeaderboardShare;
