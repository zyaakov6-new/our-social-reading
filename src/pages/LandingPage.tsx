import { useNavigate } from "react-router-dom";
import { Trophy, Medal, Star } from "lucide-react";

const DEMO_LEADERBOARD = [
  { rank: 1, name: "יעל כ׳", minutes: 147 },
  { rank: 2, name: "דני ל׳", minutes: 93 },
  { rank: 3, name: "מיכל א׳", minutes: 71 },
  { rank: 4, name: "אתה?", minutes: 0, isYou: true },
];

const RANK_ICONS = [
  <Medal size={14} strokeWidth={2} style={{ color: "hsl(43 74% 49%)" }} />,
  <Medal size={14} strokeWidth={2} style={{ color: "hsl(210 14% 65%)" }} />,
  <Medal size={14} strokeWidth={2} style={{ color: "hsl(22 65% 50%)" }} />,
];


const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "hsl(44 27% 93%)" }}>

      {/* Sticky nav */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-sm"
        style={{ background: "hsl(44 27% 93% / 0.95)", borderColor: "hsl(44 15% 80%)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="amud-pillar h-5" style={{ height: 20 }} />
            <span className="font-display text-xl tracking-[0.18em]" style={{ color: "hsl(126 15% 28%)" }}>
              AMUD
            </span>
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="text-sm font-semibold px-4 py-1.5 rounded-lg border transition-colors"
            style={{ color: "hsl(126 15% 28%)", borderColor: "hsl(126 15% 28%)" }}
          >
            כניסה
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5">

        {/* ── Hero ────────────────────────────────── */}
        <section className="pt-12 pb-8 text-center space-y-5">
          <div className="space-y-3">
            <h1
              className="font-display leading-tight tracking-[0.06em]"
              style={{ color: "hsl(126 15% 28%)", fontSize: "clamp(2rem, 8.5vw, 2.8rem)" }}
            >
              עקוב על כל ספר.
              <br />התחרה עם חברים.
              <br />בנה הרגל שנשאר.
            </h1>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground max-w-[280px] mx-auto">
            AMUD - אפליקציית הקריאה החברתית הראשונה בעברית.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3 pt-1">
            <button
              onClick={() => navigate("/auth")}
              className="w-full max-w-[280px] h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: "hsl(126 15% 28%)", color: "white", boxShadow: "0 4px 14px hsl(126 15% 28% / 0.30)" }}
            >
              הצטרף עכשיו ←
            </button>
            <button
              onClick={() => navigate("/feed")}
              className="text-sm font-semibold transition-colors underline-offset-2 hover:underline"
              style={{ color: "hsl(126 15% 28%)" }}
            >
              נסה קודם, בלי הרשמה
            </button>
          </div>

          {/* Demo leaderboard card */}
          <p className="mt-6 text-[11px] font-medium text-center text-muted-foreground tracking-wide">
            כך זה נראה בפעולה
          </p>
          <div
            className="mt-2 rounded-2xl overflow-hidden text-right"
            style={{
              border: "1px solid hsl(44 15% 78%)",
              background: "hsl(44 30% 97%)",
              boxShadow: "0 6px 24px hsl(126 15% 28% / 0.08)",
            }}
          >
            <div
              className="px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
              style={{
                background: "hsl(28 71% 57% / 0.10)",
                borderBottom: "1px solid hsl(44 15% 80%)",
                color: "hsl(126 15% 28%)",
              }}
            >
              <Trophy size={13} strokeWidth={2} /> לוח תוצאות - השבוע
            </div>
            {DEMO_LEADERBOARD.map((r, i) => (
              <div
                key={r.rank}
                className="flex items-center gap-3 px-4 py-2.5"
                style={{
                  borderBottom: i < DEMO_LEADERBOARD.length - 1 ? "1px solid hsl(44 15% 84%)" : undefined,
                  background: r.isYou ? "hsl(126 15% 28% / 0.05)" : undefined,
                }}
              >
                <span className="w-6 flex justify-center flex-shrink-0">
                  {RANK_ICONS[i] ?? <span className="text-xs text-muted-foreground">{r.rank}</span>}
                </span>
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{
                    background: r.isYou ? "hsl(44 15% 80%)" : "hsl(126 15% 28%)",
                    color: r.isYou ? "hsl(44 12% 45%)" : "white",
                  }}
                >
                  {r.name[0]}
                </div>
                <span className={`flex-1 text-sm font-semibold ${r.isYou ? "text-muted-foreground" : ""}`}>
                  {r.name}
                </span>
                {r.minutes > 0 ? (
                  <span className="text-xs font-bold" style={{ color: "hsl(188 60% 35%)" }}>
                    {r.minutes} דק׳
                  </span>
                ) : (
                  <button
                    onClick={() => navigate("/auth")}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95"
                    style={{ background: "hsl(126 15% 28%)", color: "white" }}
                  >
                    הצטרף ←
                  </button>
                )}
              </div>
            ))}
            <div
              className="px-4 py-2.5 text-center text-[11px] font-semibold flex items-center justify-center gap-1.5"
              style={{ color: "hsl(28 71% 57%)", background: "hsl(28 71% 57% / 0.05)" }}
            >
              <Star size={11} strokeWidth={2} fill="currentColor" />
              יעל קראה 147 דקות - אתה יכול לנצח אותה השבוע!
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────── */}
        <section className="pb-10">
          <div className="flex justify-center gap-2 flex-wrap">
            {["לוח תוצאות שבועי", "ספרייה אישית", "יעדי קריאה שנתיים"].map(f => (
              <span
                key={f}
                className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ background: "hsl(126 15% 28% / 0.08)", color: "hsl(126 15% 28%)" }}
              >
                {f}
              </span>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────── */}
        <section className="pb-16">
          <div
            className="rounded-2xl p-8 text-center space-y-4"
            style={{ background: "hsl(126 15% 28%)", color: "white" }}
          >
            <h3 className="font-display text-2xl tracking-wide">הפסק לקרוא לבד.</h3>
            <p className="text-sm leading-relaxed" style={{ opacity: 0.82 }}>
              הצטרף לראשונים שבונים הרגל קריאה שנשאר - ספר אחרי ספר.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ background: "white", color: "hsl(126 15% 28%)" }}
            >
              הצטרף עכשיו ←
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 text-center"
        style={{ borderColor: "hsl(44 15% 80%)" }}
      >
        <p className="text-xs text-muted-foreground">AMUD - קריאה חברתית בעברית</p>
      </footer>

    </div>
  );
};

export default LandingPage;
