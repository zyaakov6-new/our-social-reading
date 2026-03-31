import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Medal, Star, Flame, Clock, Target, Users, BookOpen, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "year";

const DATA: Record<Period, { name: string; minutes: number; initials: string; color: string }[]> = {
  week:  [
    { name: "יעל כ׳",  minutes: 147,  initials: "י", color: "bg-primary" },
    { name: "דני ל׳",  minutes: 93,   initials: "ד", color: "bg-secondary" },
    { name: "מיכל א׳", minutes: 71,   initials: "מ", color: "bg-cta" },
  ],
  month: [
    { name: "מיכל א׳", minutes: 610,  initials: "מ", color: "bg-cta" },
    { name: "יעל כ׳",  minutes: 540,  initials: "י", color: "bg-primary" },
    { name: "רון ב׳",  minutes: 388,  initials: "ר", color: "bg-secondary" },
  ],
  year:  [
    { name: "דני ל׳",  minutes: 4820, initials: "ד", color: "bg-secondary" },
    { name: "מיכל א׳", minutes: 4210, initials: "מ", color: "bg-cta" },
    { name: "יעל כ׳",  minutes: 3990, initials: "י", color: "bg-primary" },
  ],
};

const MEDALS = [
  { icon: Medal, className: "text-yellow-400 fill-yellow-400/20" },
  { icon: Medal, className: "text-slate-400 fill-slate-400/20" },
  { icon: Medal, className: "text-amber-600 fill-amber-600/20" },
];

const PERIOD_LABEL: Record<Period, string> = { week: "השבוע", month: "החודש", year: "השנה" };

const fmtMinutes = (m: number) => {
  if (m < 60) return `${m} דק׳`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem ? `${h}:${String(rem).padStart(2, "0")} שע׳` : `${h} שע׳`;
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" } }),
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("week");
  const rows = DATA[period];
  const leader = rows[0];

  return (
    <div dir="rtl" className="min-h-screen bg-background">

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2.5">
            <span className="block w-[3px] h-6 rounded-full bg-primary flex-shrink-0" />
            <span className="font-display text-xl tracking-[0.18em] text-primary">AMUD</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="touch-manipulation font-semibold">
            כניסה
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 pb-4 space-y-5">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="text-center space-y-3 pt-2">
          <Badge variant="outline" className="font-bold tracking-widest uppercase text-[10px] px-3 py-1 border-primary/30 text-primary">
            אפליקציית מעקב קריאה חברתית
          </Badge>
          <h1 className="font-display leading-[1.15] tracking-[0.05em]" style={{ fontSize: "clamp(1.9rem, 8vw, 2.8rem)" }}>
            <span className="text-primary">עקוב אחרי כל ספר.</span>
            <br />
            <span className="text-[hsl(28_71%_50%)]">התחרה עם חברים.</span>
            <br />
            <span className="text-primary">בנה הרגל שנשאר.</span>
          </h1>
        </motion.div>

        {/* ── CTAs - above the fold ─────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="space-y-2.5">
          <Button
            size="lg"
            className="w-full touch-manipulation font-bold text-base shadow-md shadow-primary/20 gap-2"
            onClick={() => navigate("/feed")}
          >
            נסה בלי הרשמה
            <ArrowLeft size={16} />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full touch-manipulation font-semibold border-primary/40 text-primary hover:bg-primary/5"
            onClick={() => navigate("/auth")}
          >
            הצטרף עכשיו
          </Button>
        </motion.div>

        {/* ── Leaderboard card ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          <Card className="overflow-hidden shadow-lg border-border/60">
            {/* Dark header */}
            <div className="bg-primary px-4 pt-4 pb-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-primary-foreground">לוח תוצאות</span>
                </div>
                <Badge className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20 border-0 text-[10px] font-bold">
                  אתגר: 52 ספרים ב-2026
                </Badge>
              </div>

              <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
                <TabsList className="w-full bg-primary-foreground/10 rounded-t-lg rounded-b-none border-0 h-9 p-0.5 gap-0.5">
                  {(["week", "month", "year"] as Period[]).map(p => (
                    <TabsTrigger
                      key={p}
                      value={p}
                      className="flex-1 text-sm text-primary-foreground/70 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:shadow-sm touch-manipulation rounded-md transition-all"
                    >
                      {PERIOD_LABEL[p]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Rows */}
            <CardContent className="p-0">
              {rows.map((r, i) => {
                const M = MEDALS[i];
                return (
                  <div key={r.name}>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <span className="w-5 text-center text-xs font-bold text-muted-foreground/60 flex-shrink-0 tabular-nums">
                        {i + 1}
                      </span>
                      <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-background shadow-sm">
                        <AvatarFallback className={cn("text-xs font-bold text-white", r.color)}>
                          {r.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm font-semibold">{r.name}</span>
                      <M.icon size={16} className={cn("flex-shrink-0", M.className)} strokeWidth={1.5} />
                      <span className="text-sm font-bold text-secondary tabular-nums">{fmtMinutes(r.minutes)}</span>
                    </div>
                    {i < rows.length - 1 && <Separator className="mx-4 w-auto" />}
                  </div>
                );
              })}

              {/* You row */}
              <div className="mx-3 mb-3 mt-2 rounded-xl overflow-hidden"
                style={{ background: "linear-gradient(135deg, hsl(126 15% 28%) 0%, hsl(188 60% 30%) 100%)" }}>
                <div className="flex items-center gap-3 px-3 py-3">
                  <span className="w-5 text-center text-xs font-bold text-white/40 flex-shrink-0">?</span>
                  <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-white/20">
                    <AvatarFallback className="bg-white/15 text-white/60 text-sm font-bold">?</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-semibold text-white/90">את/ה יכול/ה להיות כאן</span>
                  <Button
                    size="sm"
                    onClick={() => navigate("/auth")}
                    className="bg-[hsl(28_71%_57%)] hover:bg-[hsl(28_71%_50%)] text-white border-0 h-8 px-4 text-xs font-bold shadow-md touch-manipulation"
                  >
                    הצטרף
                  </Button>
                </div>
              </div>

              {/* Motivational line */}
              <div className="flex items-center justify-center gap-1.5 px-4 pb-3">
                <Star size={11} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {leader.name} קרא/ה {fmtMinutes(leader.minutes)} - אתה יכול לנצח {PERIOD_LABEL[period]}!
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Stat mini-cards ───────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Flame, value: "12", label: "יום רצף", accent: "hsl(28 71% 57%)", accentBg: "hsl(28 71% 57% / 0.08)" },
            { icon: Clock, value: "3:20", label: "שע׳ השבוע", accent: "hsl(188 60% 35%)", accentBg: "hsl(188 60% 35% / 0.08)" },
            { icon: BookOpen, value: "7", label: "ספרים", accent: "hsl(126 15% 28%)", accentBg: "hsl(126 15% 28% / 0.08)" },
          ].map(({ icon: Icon, value, label, accent, accentBg }) => (
            <Card key={label} className="overflow-hidden border-border/60">
              <div className="h-1" style={{ background: accent }} />
              <CardContent className="flex flex-col items-center pt-3 pb-3 px-1 gap-0.5">
                <Icon size={16} style={{ color: accent }} />
                <span className="text-2xl font-extrabold leading-tight tabular-nums" style={{ color: accent }}>{value}</span>
                <span className="text-[9px] text-muted-foreground text-center leading-tight">{label}</span>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* ── Goal progress card ────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
          <Card className="border-border/60">
            <CardContent className="py-4 px-4 space-y-3.5">
              <div className="flex items-center gap-2 mb-0.5">
                <Target size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary">יעדים</span>
              </div>
              {[
                { label: "יעד יומי", sub: "25/30 דקות", value: 83 },
                { label: "יעד 2026", sub: "7/24 ספרים",  value: 29 },
              ].map(g => (
                <div key={g.label} className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-foreground/80">{g.label}</span>
                    <span className="text-[10px] text-muted-foreground">{g.sub}</span>
                  </div>
                  <Progress value={g.value} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>


      </main>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp} initial="hidden" animate="visible" custom={5}
        className="px-4 pb-16 max-w-lg mx-auto"

      >
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-primary px-6 py-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary-foreground/60 text-xs mb-1">
              <Users size={13} />
              <span>847 קוראים כבר בפנים</span>
            </div>
            <h3 className="font-display text-3xl tracking-wide text-primary-foreground leading-tight">
              הפסק לקרוא לבד.
            </h3>
            <p className="text-sm leading-relaxed text-primary-foreground/75 max-w-xs mx-auto">
              הצטרף לראשונים שבונים הרגל קריאה שנשאר - ספר אחרי ספר.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-[hsl(28_71%_57%)] hover:bg-[hsl(28_71%_50%)] text-white border-0 font-bold shadow-lg shadow-black/20 touch-manipulation mt-2"
            >
              הצטרף עכשיו ←
            </Button>
          </div>
        </Card>
      </motion.section>

      <footer className="border-t py-6 text-center">
        <p className="text-xs text-muted-foreground">AMUD - קריאה חברתית בעברית</p>
      </footer>

    </div>
  );
}
