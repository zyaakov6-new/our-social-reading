import { useNavigate } from "react-router-dom";
import { Trophy, BookOpen, Target } from "lucide-react";

const DEMO_LEADERBOARD = [
  { rank: 1, name: "יעל כ׳", minutes: 147, medal: "🥇" },
  { rank: 2, name: "דני ל׳", minutes: 93, medal: "🥈" },
  { rank: 3, name: "מיכל א׳", minutes: 71, medal: "🥉" },
  { rank: 4, name: "אתה?", minutes: 0, isYou: true },
];

const FEATURES = [
  {
    icon: <Trophy size={20} />,
    emoji: "🏆",
    title: "לוח תוצאות שבועי",
    desc: "ראה כמה דקות קרא כל חבר השבוע — ותנצח אותו. כי תחרות עושה אותך קורא טוב יותר.",
  },
  {
    icon: <BookOpen size={20} />,
    emoji: "📚",
    title: "ספרייה אישית",
    desc: "רשימת רצון, ספרים שסיימת, ומה שאתה קורא עכשיו — הכל במקום אחד, בעברית.",
  },
  {
    icon: <Target size={20} />,
    emoji: "🎯",
    title: "יעד קריאה שנתי",
    desc: "קבע כמה ספרים תקרא השנה ועקוב אחרי ההתקדמות. עם סרגל התקדמות שמחכה לך כל בוקר.",
  },
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
          <div className="space-y-2">
            <h1
              className="font-display leading-tight tracking-[0.06em]"
              style={{ color: "hsl(126 15% 28%)", fontSize: "clamp(2.2rem, 9vw, 3rem)" }}
            >
              קוראים לבד?
            </h1>
            <h2
              className="font-serif text-2xl font-bold leading-snug"
              style={{ color: "hsl(126 10% 20%)" }}
            >
              הגיע הזמן לשנות את זה.
            </h2>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground max-w-[300px] mx-auto">
            AMUD היא האפליקציה העברית הראשונה לקריאה חברתית —
            התחרה עם חברים, עקוב אחרי הספרים שלך,
            והפסק לאבד מוטיבציה באמצע ספר.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3 pt-1">
            <button
              onClick={() => navigate("/auth")}
              className="w-full max-w-[280px] h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: "hsl(126 15% 28%)", color: "white", boxShadow: "0 4px 14px hsl(126 15% 28% / 0.30)" }}
            >
              הצטרף בחינם ←
            </button>
            <button
              onClick={() => navigate("/feed")}
              className="text-sm font-semibold transition-colors underline-offset-2 hover:underline"
              style={{ color: "hsl(126 15% 28%)" }}
            >
              גלה את האפליקציה קודם
            </button>
          </div>

          {/* Demo leaderboard card */}
          <div
            className="mt-4 rounded-2xl overflow-hidden text-right"
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
              <Trophy size={13} strokeWidth={2} /> לוח תוצאות — השבוע
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
                <span className="text-sm w-6 text-center flex-shrink-0">{r.medal ?? r.rank}</span>
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
              className="px-4 py-2.5 text-center text-[11px] font-semibold"
              style={{ color: "hsl(28 71% 57%)", background: "hsl(28 71% 57% / 0.05)" }}
            >
              ✨ יעל קראה 147 דקות — אתה יכול לנצח אותה השבוע!
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────── */}
        <section className="pb-10 space-y-3">
          <h3
            className="text-xs font-bold tracking-widest text-center mb-5"
            style={{ color: "hsl(44 12% 55%)" }}
          >
            מה יש ב-AMUD
          </h3>
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="flex items-start gap-4 rounded-2xl p-4"
              style={{ background: "hsl(44 30% 97%)", border: "1px solid hsl(44 15% 80%)" }}
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{f.emoji}</span>
              <div>
                <p className="font-bold text-sm mb-1">{f.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Social proof ────────────────────────── */}
        <section className="pb-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
            style={{ background: "hsl(44 30% 97%)", border: "1px solid hsl(44 15% 80%)", color: "hsl(126 15% 28%)" }}
          >
            📖 כבר מאות קוראים ישראלים מתחרים ומשתפים ב-AMUD
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────── */}
        <section className="pb-16">
          <div
            className="rounded-2xl p-8 text-center space-y-4"
            style={{ background: "hsl(126 15% 28%)", color: "white" }}
          >
            <h3 className="font-display text-2xl tracking-wide">הפסק לקרוא לבד</h3>
            <p className="text-sm leading-relaxed" style={{ opacity: 0.82 }}>
              הצטרף לקהילת הקוראים העברית הראשונה.<br />
              בחינם. תמיד. בלי פרסומות.
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
        <p className="text-xs text-muted-foreground">AMUD — עמוד · בחינם לתמיד · קריאה חברתית בעברית</p>
      </footer>

    </div>
  );
};

export default LandingPage;
