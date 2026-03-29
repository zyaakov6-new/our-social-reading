import { useNavigate } from "react-router-dom";
import { Flame, Clock, BookOpen, Target, Users } from "lucide-react";

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
            className="text-sm font-semibold px-4 py-1.5 rounded-lg border transition-colors touch-manipulation"
            style={{ color: "hsl(126 15% 28%)", borderColor: "hsl(126 15% 28%)" }}
          >
            כניסה
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5">
        <section className="pt-8 pb-10 space-y-5">

          {/* 1. Descriptor — removes all ambiguity */}
          <div className="text-center">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: "hsl(126 15% 28% / 0.10)", color: "hsl(126 15% 28%)" }}
            >
              אפליקציית מעקב קריאה חברתית
            </span>
          </div>

          {/* 2. Tagline */}
          <h1
            className="font-display leading-tight tracking-[0.06em] text-center"
            style={{ color: "hsl(126 15% 28%)", fontSize: "clamp(1.8rem, 7.5vw, 2.6rem)" }}
          >
            עקוב אחרי כל ספר.
            <br />התחרה עם חברים.
            <br />בנה הרגל שנשאר.
          </h1>

          {/* 3. App preview mockup — shows what the inside looks like */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid hsl(44 15% 78%)",
              background: "hsl(44 30% 97%)",
              boxShadow: "0 6px 24px hsl(126 15% 28% / 0.08)",
            }}
          >
            {/* Mock top bar */}
            <div
              className="px-4 py-2 text-[11px] font-bold flex items-center gap-1.5"
              style={{ borderBottom: "1px solid hsl(44 15% 82%)", color: "hsl(126 15% 28% / 0.55)" }}
            >
              הדשבורד שלי
            </div>

            {/* Stat row */}
            <div className="flex gap-2 p-3">
              <div className="flex-1 flex flex-col items-center py-2.5 rounded-xl" style={{ background: "hsl(28 71% 57% / 0.10)" }}>
                <Flame size={17} style={{ color: "hsl(28 71% 57%)" }} />
                <span className="text-xl font-extrabold leading-none mt-1" style={{ color: "hsl(28 71% 45%)" }}>12</span>
                <span className="text-[9px] text-muted-foreground mt-0.5">יום רצף</span>
              </div>
              <div className="flex-1 flex flex-col items-center py-2.5 rounded-xl" style={{ background: "hsl(188 60% 35% / 0.08)" }}>
                <Clock size={17} style={{ color: "hsl(188 60% 35%)" }} />
                <span className="text-xl font-extrabold leading-none mt-1" style={{ color: "hsl(188 60% 35%)" }}>3:20</span>
                <span className="text-[9px] text-muted-foreground mt-0.5">שעות השבוע</span>
              </div>
              <div className="flex-1 flex flex-col items-center py-2.5 rounded-xl" style={{ background: "hsl(126 15% 28% / 0.08)" }}>
                <BookOpen size={17} style={{ color: "hsl(126 15% 28%)" }} />
                <span className="text-xl font-extrabold leading-none mt-1" style={{ color: "hsl(126 15% 28%)" }}>7</span>
                <span className="text-[9px] text-muted-foreground mt-0.5">ספרים</span>
              </div>
            </div>

            {/* Goal progress */}
            <div className="px-3 pb-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: "hsl(126 15% 28%)" }}>יעד יומי</span>
                <span className="text-[10px] text-muted-foreground">25/30 דקות היום</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "83%", background: "hsl(28 71% 57%)" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: "hsl(126 15% 28%)" }}>יעד 2026</span>
                <span className="text-[10px] text-muted-foreground">7/24 ספרים</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: "29%", background: "linear-gradient(to left, hsl(126 15% 28%), hsl(188 60% 35%))" }} />
              </div>
            </div>
          </div>

          {/* 4. Challenge card — social proof through scale, not stranger names */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid hsl(44 15% 78%)",
              background: "hsl(44 30% 97%)",
              boxShadow: "0 6px 24px hsl(126 15% 28% / 0.06)",
            }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid hsl(44 15% 82%)" }}
            >
              <Target size={14} strokeWidth={2} style={{ color: "hsl(188 60% 35%)" }} />
              <span className="text-sm font-bold" style={{ color: "hsl(126 15% 28%)" }}>אתגר השנה: 24 ספרים ב-2026</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "62%", background: "linear-gradient(to left, hsl(126 15% 28%), hsl(188 60% 35%))" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5" style={{ color: "hsl(126 15% 28%)" }}>
                  <Users size={12} strokeWidth={2} />
                  <span className="text-xs font-bold">847 קוראים הצטרפו</span>
                </div>
                <button
                  onClick={() => navigate("/auth")}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 touch-manipulation"
                  style={{ background: "hsl(126 15% 28%)", color: "white" }}
                >
                  הצטרף לאתגר ←
                </button>
              </div>
            </div>
          </div>

          {/* 5. CTAs — try-first is primary, sign up is secondary */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/feed")}
              className="flex-1 h-12 rounded-xl text-sm font-bold transition-all active:scale-95 touch-manipulation"
              style={{ background: "hsl(126 15% 28%)", color: "white", boxShadow: "0 4px 14px hsl(126 15% 28% / 0.28)" }}
            >
              נסה בלי הרשמה ←
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="flex-1 h-12 rounded-xl text-sm font-bold border transition-all active:scale-95 touch-manipulation"
              style={{ color: "hsl(126 15% 28%)", borderColor: "hsl(126 15% 28%)", background: "transparent" }}
            >
              הצטרף
            </button>
          </div>

        </section>

        {/* Final CTA for scrollers */}
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
