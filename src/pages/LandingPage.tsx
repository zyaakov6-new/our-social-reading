import { useNavigate } from "react-router-dom";
import { Trophy, Medal, Star } from "lucide-react";

/* ── New palette ──────────────────────────────────────────────────── */
const C = {
  navy:    "#0D1B3E",
  orange:  "#FF6D00",
  blue:    "#2979FF",
  white:   "#FDFCFB",
  navyFg:  "#FDFCFB",
  muted:   "#6B7A99",
  border:  "#E2E6EF",
  cardBg:  "#FFFFFF",
};

const DEMO_LEADERBOARD = [
  { rank: 1, name: "יעל כ׳", minutes: 147 },
  { rank: 2, name: "דני ל׳", minutes: 93 },
  { rank: 3, name: "מיכל א׳", minutes: 71 },
  { rank: 4, name: "אתה?", minutes: 0, isYou: true },
];

const RANK_ICONS = [
  <Medal size={14} strokeWidth={2} style={{ color: "#F5A623" }} />,
  <Medal size={14} strokeWidth={2} style={{ color: "#9BAABB" }} />,
  <Medal size={14} strokeWidth={2} style={{ color: "#C97B4B" }} />,
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: C.white }}>

      {/* Sticky nav */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-sm"
        style={{ background: `${C.white}F2`, borderColor: C.border }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span
              style={{ display: "block", width: 3, height: 22, background: C.orange, borderRadius: 2, flexShrink: 0 }}
            />
            <span className="font-display text-xl tracking-[0.18em]" style={{ color: C.navy }}>
              AMUD
            </span>
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="text-sm font-semibold px-4 py-1.5 rounded-lg border transition-colors touch-manipulation"
            style={{ color: C.navy, borderColor: C.navy }}
          >
            כניסה
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5">

        {/* ── Hero ──────────────────────────────────── */}
        <section className="pt-10 pb-8 text-center space-y-5">

          <h1
            className="font-display leading-tight tracking-[0.04em]"
            style={{ color: C.navy, fontSize: "clamp(1.9rem, 7.5vw, 2.7rem)" }}
          >
            עקוב אחרי כל ספר.
            <br />
            <span style={{ color: C.orange }}>התחרה עם חברים.</span>
            <br />
            בנה הרגל שנשאר.
          </h1>

          {/* Demo leaderboard card */}
          <div
            className="mt-2 rounded-2xl overflow-hidden text-right"
            style={{
              border: `1px solid ${C.border}`,
              background: C.cardBg,
              boxShadow: "0 8px 32px rgba(13,27,62,0.10)",
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
              style={{
                background: C.navy,
                color: C.navyFg,
              }}
            >
              <Trophy size={13} strokeWidth={2} style={{ color: C.orange }} />
              לוח תוצאות - השבוע
            </div>

            {DEMO_LEADERBOARD.map((r, i) => (
              <div
                key={r.rank}
                className="flex items-center gap-3 px-4 py-2.5"
                style={{
                  borderBottom: i < DEMO_LEADERBOARD.length - 1 ? `1px solid ${C.border}` : undefined,
                  background: r.isYou ? `${C.blue}0A` : undefined,
                }}
              >
                <span className="w-6 flex justify-center flex-shrink-0">
                  {RANK_ICONS[i] ?? <span className="text-xs" style={{ color: C.muted }}>{r.rank}</span>}
                </span>
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{
                    background: r.isYou ? C.border : C.blue,
                    color: r.isYou ? C.muted : "white",
                  }}
                >
                  {r.name[0]}
                </div>
                <span className="flex-1 text-sm font-semibold" style={{ color: r.isYou ? C.muted : C.navy }}>
                  {r.name}
                </span>
                {r.minutes > 0 ? (
                  <span className="text-xs font-bold" style={{ color: C.blue }}>
                    {r.minutes} דק׳
                  </span>
                ) : (
                  <button
                    onClick={() => navigate("/auth")}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 touch-manipulation"
                    style={{ background: C.orange, color: "white" }}
                  >
                    הצטרף ←
                  </button>
                )}
              </div>
            ))}

            {/* Footer */}
            <div
              className="px-4 py-2.5 text-center text-[11px] font-semibold flex items-center justify-center gap-1.5"
              style={{ color: C.orange, background: `${C.orange}0D` }}
            >
              <Star size={11} strokeWidth={2} fill="currentColor" />
              יעל קראה 147 דקות - אתה יכול לנצח אותה השבוע!
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => navigate("/auth")}
            className="w-full max-w-[280px] h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-all active:scale-95 touch-manipulation"
            style={{
              background: C.orange,
              color: "white",
              boxShadow: `0 4px 18px ${C.orange}50`,
            }}
          >
            הצטרף עכשיו ←
          </button>

          <button
            onClick={() => navigate("/feed")}
            className="text-sm font-medium touch-manipulation"
            style={{ color: C.muted, textDecoration: "underline", textDecorationColor: `${C.muted}60`, textUnderlineOffset: "3px" }}
          >
            נסה קודם, בלי הרשמה
          </button>

        </section>

        {/* ── Feature chips ────────────────────────── */}
        <section className="pb-10">
          <div className="flex justify-center gap-2 flex-wrap">
            {["לוח תוצאות שבועי", "ספרייה אישית", "יעדי קריאה שנתיים"].map(f => (
              <span
                key={f}
                className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={{ background: `${C.blue}14`, color: C.blue }}
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
            style={{ background: C.navy, color: C.navyFg }}
          >
            <h3 className="font-display text-2xl tracking-wide">הפסק לקרוא לבד.</h3>
            <p className="text-sm leading-relaxed" style={{ opacity: 0.78 }}>
              הצטרף לראשונים שבונים הרגל קריאה שנשאר - ספר אחרי ספר.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 touch-manipulation"
              style={{ background: C.orange, color: "white", boxShadow: `0 4px 14px ${C.orange}50` }}
            >
              הצטרף עכשיו ←
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 text-center"
        style={{ borderColor: C.border }}
      >
        <p className="text-xs" style={{ color: C.muted }}>AMUD - קריאה חברתית בעברית</p>
      </footer>

    </div>
  );
};

export default LandingPage;
