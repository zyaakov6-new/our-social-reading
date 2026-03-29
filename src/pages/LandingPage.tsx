import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Medal, Star } from "lucide-react";

type Period = "week" | "month" | "year";

const TABS: { id: Period; label: string }[] = [
  { id: "week",  label: "השבוע" },
  { id: "month", label: "החודש" },
  { id: "year",  label: "השנה" },
];

const DATA: Record<Period, { name: string; minutes: number }[]> = {
  week:  [{ name: "יעל כ׳", minutes: 147 }, { name: "דני ל׳", minutes: 93 }, { name: "מיכל א׳", minutes: 71 }],
  month: [{ name: "מיכל א׳", minutes: 610 }, { name: "יעל כ׳", minutes: 540 }, { name: "רון ב׳", minutes: 388 }],
  year:  [{ name: "דני ל׳", minutes: 4820 }, { name: "מיכל א׳", minutes: 4210 }, { name: "יעל כ׳", minutes: 3990 }],
};

const PERIOD_LABEL: Record<Period, string> = {
  week: "השבוע",
  month: "החודש",
  year: "השנה",
};

const MEDAL_COLORS = [
  "hsl(43 74% 49%)",   // gold
  "hsl(210 14% 65%)",  // silver
  "hsl(22 65% 50%)",   // bronze
];

const AVATAR_COLORS = [
  "hsl(126 15% 28%)",
  "hsl(188 60% 35%)",
  "hsl(28 71% 50%)",
];

const fmtMinutes = (m: number) => {
  if (m < 60) return `${m} דק׳`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem > 0 ? `${h}:${String(rem).padStart(2, "0")} שע׳` : `${h} שע׳`;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("week");
  const rows = DATA[period];

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
            className="text-sm font-semibold px-4 py-1.5 rounded-lg border transition-colors touch-manipulation"
            style={{ color: "hsl(126 15% 28%)", borderColor: "hsl(126 15% 28%)" }}
          >
            כניסה
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5">
        <section className="pt-8 pb-10 space-y-5">

          {/* Descriptor */}
          <div className="text-center">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: "hsl(126 15% 28% / 0.10)", color: "hsl(126 15% 28%)" }}
            >
              אפליקציית מעקב קריאה חברתית
            </span>
          </div>

          {/* Tagline */}
          <h1
            className="font-display leading-tight tracking-[0.06em] text-center"
            style={{ color: "hsl(126 15% 28%)", fontSize: "clamp(1.8rem, 7.5vw, 2.6rem)" }}
          >
            עקוב אחרי כל ספר.
            <br />התחרה עם חברים.
            <br />בנה הרגל שנשאר.
          </h1>

          {/* Leaderboard card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid hsl(44 15% 78%)",
              background: "hsl(44 30% 97%)",
              boxShadow: "0 6px 24px hsl(126 15% 28% / 0.08)",
            }}
          >
            {/* Tabs */}
            <div className="flex" style={{ borderBottom: "1px solid hsl(44 15% 80%)" }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setPeriod(t.id)}
                  className="flex-1 py-2.5 text-sm font-bold transition-colors touch-manipulation"
                  style={{
                    color: period === t.id ? "hsl(126 15% 28%)" : "hsl(44 12% 55%)",
                    borderBottom: period === t.id ? "2px solid hsl(126 15% 28%)" : "2px solid transparent",
                    background: "transparent",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Header row */}
            <div
              className="px-4 py-2 flex items-center justify-between"
              style={{ borderBottom: "1px solid hsl(44 15% 82%)" }}
            >
              <span className="text-[11px] font-bold" style={{ color: "hsl(126 15% 28% / 0.55)" }}>
                לוח תוצאות — {PERIOD_LABEL[period]}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "hsl(188 60% 35% / 0.12)", color: "hsl(188 60% 35%)" }}
              >
                אתגר: 52 ספרים ב-2026
              </span>
            </div>

            {/* Rows */}
            {rows.map((r, i) => (
              <div
                key={r.name}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid hsl(44 15% 84%)" }}
              >
                <span className="text-sm font-bold w-5 text-center flex-shrink-0" style={{ color: "hsl(44 12% 55%)" }}>
                  {i + 1}
                </span>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                  style={{ background: AVATAR_COLORS[i], color: "white" }}
                >
                  {r.name[0]}
                </div>
                <span className="flex-1 text-sm font-semibold" style={{ color: "hsl(126 15% 22%)" }}>
                  {r.name}
                </span>
                <Medal size={14} strokeWidth={2} style={{ color: MEDAL_COLORS[i] }} />
                <span className="text-xs font-bold" style={{ color: "hsl(188 60% 35%)" }}>
                  {fmtMinutes(r.minutes)}
                </span>
              </div>
            ))}

            {/* "You could be here" row */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: "hsl(126 15% 28%)", borderBottom: "1px solid hsl(126 15% 22%)" }}
            >
              <span className="text-sm font-bold w-5 text-center flex-shrink-0" style={{ color: "hsl(44 27% 93% / 0.5)" }}>?</span>
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                style={{ background: "hsl(44 27% 93% / 0.15)", color: "hsl(44 27% 93% / 0.6)" }}
              >
                ?
              </div>
              <span className="flex-1 text-sm font-semibold" style={{ color: "hsl(44 27% 93% / 0.85)" }}>
                את/ה יכול/ה להיות כאן
              </span>
              <button
                onClick={() => navigate("/auth")}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 touch-manipulation"
                style={{ background: "hsl(28 71% 57%)", color: "white" }}
              >
                הצטרף
              </button>
            </div>

            {/* Motivational footer */}
            <div
              className="px-4 py-2.5 text-center text-[11px] font-semibold flex items-center justify-center gap-1.5"
              style={{ color: "hsl(28 71% 50%)", background: "hsl(28 71% 57% / 0.06)" }}
            >
              <Star size={11} strokeWidth={2} fill="currentColor" />
              {rows[0].name} קרא/ה {fmtMinutes(rows[0].minutes)} — אתה יכול לנצח {PERIOD_LABEL[period]}!
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2.5">
            <button
              onClick={() => navigate("/auth")}
              className="w-full h-12 rounded-xl text-sm font-bold transition-all active:scale-95 touch-manipulation"
              style={{ background: "hsl(126 15% 28%)", color: "white", boxShadow: "0 4px 14px hsl(126 15% 28% / 0.28)" }}
            >
              הצטרף עכשיו ←
            </button>
            <button
              onClick={() => navigate("/feed")}
              className="w-full h-12 rounded-xl text-sm font-bold border transition-all active:scale-95 touch-manipulation"
              style={{ color: "hsl(126 15% 28%)", borderColor: "hsl(126 15% 28% / 0.4)", background: "transparent" }}
            >
              נסה קודם, בלי הרשמה ←
            </button>
          </div>

        </section>

        {/* Final CTA */}
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
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 touch-manipulation"
              style={{ background: "white", color: "hsl(126 15% 28%)" }}
            >
              הצטרף עכשיו ←
            </button>
          </div>
        </section>

      </main>

      <footer className="border-t py-6 text-center" style={{ borderColor: "hsl(44 15% 80%)" }}>
        <p className="text-xs text-muted-foreground">AMUD - קריאה חברתית בעברית</p>
      </footer>

    </div>
  );
};

export default LandingPage;
