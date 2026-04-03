import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Medal, Star, Flame, Clock, Target, Users, BookOpen, ArrowLeft, ArrowRight, Check, Trophy, BarChart2, BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

type Period = "week" | "month" | "year";

const DATA_HE: Record<Period, { name: string; minutes: number; initials: string; color: string }[]> = {
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

const DATA_EN: Record<Period, { name: string; minutes: number; initials: string; color: string }[]> = {
  week:  [
    { name: "Sarah M.", minutes: 147, initials: "S", color: "bg-primary" },
    { name: "Dan L.",   minutes: 93,  initials: "D", color: "bg-secondary" },
    { name: "Mike A.",  minutes: 71,  initials: "M", color: "bg-cta" },
  ],
  month: [
    { name: "Mike A.",  minutes: 610, initials: "M", color: "bg-cta" },
    { name: "Sarah M.", minutes: 540, initials: "S", color: "bg-primary" },
    { name: "Ron B.",   minutes: 388, initials: "R", color: "bg-secondary" },
  ],
  year:  [
    { name: "Dan L.",   minutes: 4820, initials: "D", color: "bg-secondary" },
    { name: "Mike A.",  minutes: 4210, initials: "M", color: "bg-cta" },
    { name: "Sarah M.", minutes: 3990, initials: "S", color: "bg-primary" },
  ],
};

const MEDALS = [
  { icon: Medal, className: "text-yellow-400 fill-yellow-400/20" },
  { icon: Medal, className: "text-slate-400 fill-slate-400/20" },
  { icon: Medal, className: "text-amber-600 fill-amber-600/20" },
];

const fmtMinutes = (m: number, lang: "he" | "en") => {
  if (m < 60) return lang === "he" ? `${m} דק׳` : `${m} min`;
  const h = Math.floor(m / 60), rem = m % 60;
  if (lang === "he") return rem ? `${h}:${String(rem).padStart(2, "0")} שע׳` : `${h} שע׳`;
  return rem ? `${h}h ${rem}m` : `${h}h`;
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" } }),
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, lang, dir } = useLanguage();
  const [period, setPeriod] = useState<Period>("week");

  const DATA = lang === "he" ? DATA_HE : DATA_EN;
  const rows = DATA[period];
  const leader = rows[0];
  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const PERIOD_LABEL: Record<Period, string> = {
    week: t.leaderboard.weekly,
    month: t.leaderboard.monthly,
    year: t.leaderboard.yearly,
  };

  return (
    <div dir={dir} className="min-h-screen bg-background">

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2.5">
            <span className="block w-[3px] h-6 rounded-full bg-primary flex-shrink-0" />
            <span className="font-display text-xl tracking-[0.18em] text-primary">AMUD</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="touch-manipulation font-semibold">
              {t.landing.login}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 pb-28 space-y-6">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="text-center space-y-3 pt-2">
          <Badge variant="outline" className="font-bold tracking-widest uppercase text-[10px] px-3 py-1 border-primary/30 text-primary">
            {t.landing.badge}
          </Badge>
          <h1 className="font-display leading-[1.2] tracking-[0.03em]" style={{ fontSize: "clamp(1.75rem, 7.5vw, 2.6rem)" }}>
            <span className="text-muted-foreground/70">{t.landing.line1}</span>
            <br />
            <span className="text-muted-foreground/70">{t.landing.line2}</span>
            <br />
            <span className="text-primary">{t.landing.line3}</span>
          </h1>
        </motion.div>

        {/* ── Social proof bar ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="flex items-center justify-center gap-4 flex-wrap text-[11px] text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            {t.landing.socialProof}
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1"><Clock size={11} className="text-muted-foreground/60" /> {t.landing.proofMinutes}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1"><Flame size={11} className="text-muted-foreground/60" /> {t.landing.proofStreak}</span>
        </motion.div>

        {/* ── CTAs ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} className="space-y-2.5">
          <Button
            size="lg"
            className="w-full touch-manipulation font-bold text-base shadow-md shadow-primary/20 gap-2"
            onClick={() => navigate("/auth")}
          >
            {t.landing.ctaJoin}
            <ArrowIcon size={16} />
          </Button>
          <button
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1 touch-manipulation"
            onClick={() => navigate("/feed")}
          >
            {t.landing.ctaTry} →
          </button>
        </motion.div>

        {/* ── Leaderboard card ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <Card className="overflow-hidden shadow-lg border-border/60">
            <div className="bg-primary px-4 pt-4 pb-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-primary-foreground">{t.landing.leaderboardTitle}</span>
                </div>
                <Badge className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20 border-0 text-[10px] font-bold">
                  {t.landing.challengeBadge}
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
                      <span className="text-sm font-bold text-secondary tabular-nums">{fmtMinutes(r.minutes, lang)}</span>
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
                  <span className="flex-1 text-sm font-semibold text-white/90">{t.landing.youCouldBeHere}</span>
                  <Button
                    size="sm"
                    onClick={() => navigate("/auth")}
                    className="bg-[hsl(28_71%_57%)] hover:bg-[hsl(28_71%_50%)] text-white border-0 h-8 px-4 text-xs font-bold shadow-md touch-manipulation"
                  >
                    {t.landing.joinBtn}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 px-4 pb-3">
                <Star size={11} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {lang === "he"
                    ? `${leader.name} קרא/ה ${fmtMinutes(leader.minutes, "he")} - אתה יכול לנצח ${PERIOD_LABEL[period]}!`
                    : `${leader.name} read ${fmtMinutes(leader.minutes, "en")} - you can beat them ${PERIOD_LABEL[period].toLowerCase()}!`
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── How it works ──────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="space-y-3">
          <h2 className="text-sm font-bold text-center text-muted-foreground uppercase tracking-widest">
            {t.landing.howTitle}
          </h2>
          <div className="space-y-2">
            {[
              { num: "1", title: t.landing.step1Title, desc: t.landing.step1Desc, icon: BookOpen },
              { num: "2", title: t.landing.step2Title, desc: t.landing.step2Desc, icon: Clock },
              { num: "3", title: t.landing.step3Title, desc: t.landing.step3Desc, icon: Medal },
            ].map(({ num, title, desc, icon: Icon }) => (
              <div key={num} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/60">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground text-sm font-bold">
                  {num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <Icon size={18} className="text-muted-foreground/40 flex-shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Features grid ─────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5} className="space-y-3">
          <h2 className="text-sm font-bold text-center text-muted-foreground uppercase tracking-widest">
            {t.landing.featuresTitle}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Flame,      title: t.landing.feat1Title, desc: t.landing.feat1Desc },
              { icon: Trophy,     title: t.landing.feat2Title, desc: t.landing.feat2Desc },
              { icon: BookMarked, title: t.landing.feat3Title, desc: t.landing.feat3Desc },
              { icon: BarChart2,  title: t.landing.feat4Title, desc: t.landing.feat4Desc },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-border/60">
                <CardContent className="p-3.5 space-y-1.5">
                  <Icon size={15} className="text-primary/70" />
                  <p className="text-sm font-bold leading-snug">{title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ── Goal progress card ────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}>
          <Card className="border-border/60">
            <CardContent className="py-4 px-4 space-y-3.5">
              <div className="flex items-center gap-2 mb-0.5">
                <Target size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary">{t.landing.goalsTitle}</span>
              </div>
              {[
                { label: t.landing.dailyGoal, sub: lang === "he" ? "25/30 דקות" : "25/30 min", value: 83 },
                { label: t.landing.yearlyGoal, sub: lang === "he" ? "7/24 ספרים" : "7/24 books", value: 29 },
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

        {/* ── Testimonial ───────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7}>
          <Card className="border-border/60 bg-muted/30">
            <CardContent className="px-5 py-5 text-center space-y-2">
              <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                {t.landing.quoteText}
              </p>
              <p className="text-[11px] text-muted-foreground font-semibold">{t.landing.quoteAuthor}</p>
            </CardContent>
          </Card>
        </motion.div>

      </main>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <motion.section
        variants={fadeUp} initial="hidden" animate="visible" custom={8}
        className="px-4 pb-8 max-w-lg mx-auto"
      >
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-primary px-6 py-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary-foreground/60 text-xs mb-1">
              <Users size={13} />
              <span>{t.landing.socialProof}</span>
            </div>
            <h3 className="font-display text-3xl tracking-wide text-primary-foreground leading-tight">
              {t.landing.finalTitle}
            </h3>
            <p className="text-sm leading-relaxed text-primary-foreground/75 max-w-xs mx-auto">
              {t.landing.finalSubtitle}
            </p>
            {/* Free checklist */}
            <div className="flex flex-col items-center gap-1.5 text-primary-foreground/70 text-xs">
              {(lang === "he"
                ? ["ללא כרטיס אשראי", "מוכן בדקה אחת", "בחינם לגמרי"]
                : ["No credit card", "Ready in 1 minute", "Completely free"]
              ).map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check size={11} className="text-green-400" />
                  {item}
                </span>
              ))}
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-[hsl(28_71%_57%)] hover:bg-[hsl(28_71%_50%)] text-white border-0 font-bold shadow-lg shadow-black/20 touch-manipulation mt-2"
            >
              {t.landing.finalCta}
            </Button>
          </div>
        </Card>
      </motion.section>

      <footer className="border-t py-6 text-center pb-28">
        <p className="text-xs text-muted-foreground">{t.landing.footer}</p>
      </footer>

      {/* ── Sticky bottom CTA — mobile only ───────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <Button
            size="lg"
            className="w-full touch-manipulation font-bold text-base shadow-lg shadow-primary/30 gap-2"
            onClick={() => navigate("/auth")}
          >
            {t.landing.stickyJoin}
            <ArrowIcon size={16} />
          </Button>
        </div>
      </div>

    </div>
  );
}
