import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { trackEvent } from "@/lib/analytics";
import { buildAuthPath, storeAuthIntent } from "@/lib/auth-flow";
import {
  getStoredLandingVariant,
  type LandingExperimentVariant,
} from "@/lib/experiments";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" },
  }),
};

// ── Inline phone mockup ───────────────────────────────────────────────────────
const AppMockup = ({ lang }: { lang: string }) => {
  const isHe = lang === "he";
  const days = isHe
    ? ["א", "ב", "ג", "ד", "ה", "ו", "ש"]
    : ["M", "T", "W", "T", "F", "S", "S"];
  const activeDays = [0, 1, 2, 4, 5];

  return (
    <div className="relative mx-auto w-[210px] sm:w-[250px] select-none">
      {/* Ambient glow */}
      <div
        className="absolute -inset-10 -z-10 rounded-full blur-3xl"
        style={{ background: "hsl(126 15% 28% / 0.15)" }}
      />
      {/* Phone shell */}
      <div
        className="rounded-[2.6rem] p-[5px] shadow-2xl"
        style={{
          background: "hsl(210 11% 18%)",
          boxShadow: "0 30px 80px hsl(126 15% 10% / 0.45), 0 0 0 1px hsl(0 0% 100% / 0.08)",
        }}
      >
        {/* Screen */}
        <div
          className="rounded-[2.2rem] overflow-hidden"
          style={{ background: "hsl(44 27% 84%)" }}
        >
          {/* Dynamic island */}
          <div className="flex justify-center pt-2 pb-1">
            <div
              className="h-[5px] w-[72px] rounded-full"
              style={{ background: "hsl(210 11% 18%)" }}
            />
          </div>

          {/* App top bar */}
          <div className="flex items-center justify-between px-4 py-1.5">
            <span
              className="text-[9px] font-bold"
              style={{ color: "hsl(28 71% 57%)" }}
            >
              🔥 7
            </span>
            <span
              className="font-display text-[13px] tracking-[0.2em]"
              style={{ color: "hsl(126 15% 28%)" }}
            >
              AMUD
            </span>
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{
                background: "hsl(126 15% 28%)",
                color: "hsl(44 30% 93%)",
              }}
            >
              {isHe ? "מ" : "M"}
            </div>
          </div>

          <div
            className="mx-3 h-px"
            style={{ background: "hsl(44 12% 74%)" }}
          />

          {/* Feed card 1 — current user */}
          <div
            className="mx-3 mt-2.5 rounded-2xl overflow-hidden"
            style={{
              border: "1px solid hsl(44 15% 78%)",
              background: "hsl(44 22% 90%)",
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-1.5"
              style={{ background: "hsl(44 18% 86%)" }}
            >
              <span style={{ fontSize: 8, color: "hsl(210 8% 55%)" }}>
                {isHe ? "לפני שעה" : "1 hour ago"}
              </span>
              <span
                className="text-[9px] font-bold"
                style={{ color: "hsl(28 71% 57%)" }}
              >
                {isHe ? "אני" : "me"}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <div
                className="h-9 w-[26px] rounded flex-shrink-0 flex items-center justify-center"
                style={{ background: "hsl(126 15% 28%)", fontSize: 9 }}
              >
                📖
              </div>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-bold font-serif leading-tight truncate"
                  style={{ color: "hsl(210 11% 14%)" }}
                >
                  {isHe ? "הרוקחת מקהיר" : "The Alchemist"}
                </p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <span
                    className="text-[8px] rounded-full px-1.5 py-0.5 font-medium"
                    style={{
                      background: "hsl(126 15% 28% / 0.12)",
                      color: "hsl(126 15% 28%)",
                    }}
                  >
                    ⏱ 25 {isHe ? "דק׳" : "min"}
                  </span>
                  <span
                    className="text-[8px] rounded-full px-1.5 py-0.5 font-medium"
                    style={{
                      background: "hsl(188 100% 27% / 0.10)",
                      color: "hsl(188 60% 30%)",
                    }}
                  >
                    62%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feed card 2 — friend */}
          <div
            className="mx-3 mt-1.5 rounded-2xl overflow-hidden"
            style={{
              border: "1px solid hsl(44 15% 78%)",
              background: "hsl(44 22% 90%)",
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-1.5"
              style={{ background: "hsl(44 18% 86%)" }}
            >
              <span style={{ fontSize: 8, color: "hsl(210 8% 55%)" }}>
                {isHe ? "לפני 3 ש׳" : "3 hrs ago"}
              </span>
              <span
                className="text-[9px] font-semibold"
                style={{ color: "hsl(210 11% 14%)" }}
              >
                {isHe ? "נועה" : "Noa"}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <div
                className="h-9 w-[26px] rounded flex-shrink-0 flex items-center justify-center"
                style={{ background: "hsl(126 15% 34%)", fontSize: 9 }}
              >
                📗
              </div>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-bold font-serif leading-tight"
                  style={{ color: "hsl(210 11% 14%)" }}
                >
                  1984
                </p>
                <div className="flex gap-1 mt-1">
                  <span
                    className="text-[8px] rounded-full px-1.5 py-0.5 font-medium"
                    style={{
                      background: "hsl(126 15% 28% / 0.12)",
                      color: "hsl(126 15% 28%)",
                    }}
                  >
                    ⏱ 40 {isHe ? "דק׳" : "min"}
                  </span>
                  <span
                    className="text-[8px] rounded-full px-1.5 py-0.5 font-medium"
                    style={{
                      background: "hsl(188 100% 27% / 0.10)",
                      color: "hsl(188 60% 30%)",
                    }}
                  >
                    88%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly heatmap */}
          <div
            className="mx-3 my-2 rounded-xl p-2.5"
            style={{
              background: "hsl(44 22% 90%)",
              border: "1px solid hsl(44 15% 78%)",
            }}
          >
            <p
              className="text-[8px] font-semibold mb-1.5"
              style={{ color: "hsl(210 8% 48%)" }}
            >
              {isHe ? "רצף הקריאה שלי" : "My reading streak"}
            </p>
            <div className="flex justify-between gap-0.5">
              {days.map((d, i) => (
                <div key={d + i} className="flex flex-col items-center gap-0.5">
                  <div
                    className="h-4 w-4 rounded-sm"
                    style={{
                      background: activeDays.includes(i)
                        ? "hsl(126 15% 28%)"
                        : "hsl(44 15% 74%)",
                    }}
                  />
                  <span style={{ fontSize: 6, color: "hsl(210 8% 55%)" }}>
                    {d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main landing page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { lang, dir, t } = useLanguage();
  const [variant] = useState<LandingExperimentVariant>(
    () => getStoredLandingVariant(),
  );

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;
  const isHe = lang === "he";

  const copy = useMemo(() => {
    if (isHe) {
      return {
        eyebrow: "אפליקציית קריאה חברתית · freemium",
        headline: "תתחיל. תתמיד. תגמור.",
        subheadline:
          "AMUD עוזר לך לבנות הרגל קריאה אמיתי — עם מעקב יומי קל, חברים שמניעים אותך, ורצף שאתה לא רוצה לשבור.",
        primaryCta: "להצטרף בחינם",
        loginLink: "יש לי כבר חשבון",
        trust: ["התחלה חינמית", "הרשמה ב-30 שניות", "ללא כרטיס אשראי"],
        proofItems: [
          { icon: Flame, label: "רצף קריאה יומי" },
          { icon: Users, label: "חברים שמניעים" },
          { icon: Trophy, label: "אתגרים ודירוג" },
        ],
        stepsTitle: "שלושה צעדים ואתה בפנים",
        steps: [
          {
            num: "01",
            title: "מחפשים ספר",
            desc: "מקלידים שם ורואים תוצאות מיידיות מ-Google Books",
          },
          {
            num: "02",
            title: "רושמים קריאה",
            desc: "כמה דקות קראת? באיזה עמוד אתה? זהו. 20 שניות.",
          },
          {
            num: "03",
            title: "בונים רצף",
            desc: "הרצף היומי שלך גדל, החברים רואים, אתה ממשיך.",
          },
        ],
        benefitsTitle: "למה קוראים נשארים",
        benefits: [
          {
            icon: Target,
            title: "אתה יודע בדיוק איפה עצרת",
            desc: "אין יותר 'באיזה עמוד הייתי?'. כל ספר שלך עם התקדמות מדויקת.",
          },
          {
            icon: Users,
            title: "חברים הופכים את זה לכיף",
            desc: "ראה מה חבריך קוראים, השאר לייק, השתתף באתגרים משותפים.",
          },
          {
            icon: Flame,
            title: "הרצף עושה את העבודה",
            desc: "הרגל קריאה נבנה על עקביות, לא על מרתון. כל יום — דקה אחת מספיקה.",
          },
        ],
        finalHeadline: "ספר אחד. יום אחד. הרגל שנשאר.",
        finalSub: "הצטרפו לקוראים שהחליטו לסיים יותר ספרים השנה.",
        finalCta: "להצטרף עכשיו — ללא עלות",
      };
    }
    return {
      eyebrow: "Social reading app · Freemium",
      headline: "Start. Stay. Finish.",
      subheadline:
        "AMUD helps you build a real reading habit — with easy daily tracking, friends who keep you going, and a streak you don't want to break.",
      primaryCta: "Join free",
      loginLink: "I already have an account",
      trust: ["Free to start", "Sign up in 30 seconds", "No credit card"],
      proofItems: [
        { icon: Flame, label: "Daily reading streak" },
        { icon: Users, label: "Friends who motivate" },
        { icon: Trophy, label: "Challenges & rankings" },
      ],
      stepsTitle: "Three steps and you're in",
      steps: [
        {
          num: "01",
          title: "Search a book",
          desc: "Type a title and see results instantly from Google Books",
        },
        {
          num: "02",
          title: "Log your reading",
          desc: "How many minutes? What page are you on? That's it. 20 seconds.",
        },
        {
          num: "03",
          title: "Build your streak",
          desc: "Your daily streak grows, friends see it, you keep going.",
        },
      ],
      benefitsTitle: "Why readers stay",
      benefits: [
        {
          icon: Target,
          title: "Always know where you left off",
          desc: "No more 'what page was I on?'. Every book tracked with exact progress.",
        },
        {
          icon: Users,
          title: "Friends make it fun",
          desc: "See what your friends are reading, react, join shared challenges.",
        },
        {
          icon: Flame,
          title: "The streak does the work",
          desc: "Reading habits are built on consistency, not marathons. One minute a day counts.",
        },
      ],
      finalHeadline: "One book. One day. A habit that sticks.",
      finalSub: "Join readers who decided to finish more books this year.",
      finalCta: "Join now — no cost to start",
    };
  }, [isHe]);

  useEffect(() => {
    trackEvent("landing_viewed", { variant, locale: lang });
  }, [lang, variant]);

  const openAuth = (mode: "signup" | "login", cta: string) => {
    storeAuthIntent({ source: "landing", variant, mode, next: "/", action: cta });
    trackEvent("landing_cta_clicked", { variant, cta, mode });
    navigate(buildAuthPath(mode, { next: "/", source: "landing", variant, action: cta }));
  };

  return (
    <div dir={dir} className="min-h-screen bg-background">
      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          background: "hsl(44 27% 84% / 0.96)",
          borderColor: "hsl(44 12% 74%)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span
              className="block h-5 w-[3px] rounded-full"
              style={{ background: "hsl(126 15% 28%)" }}
            />
            <span
              className="font-display text-xl tracking-[0.18em]"
              style={{ color: "hsl(126 15% 28%)" }}
            >
              AMUD
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button
              onClick={() => openAuth("login", "header_login")}
              className="text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: "hsl(126 15% 28%)" }}
            >
              {copy.loginLink}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <motion.section
          className="grid gap-10 pt-12 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16"
          initial="hidden"
          animate="visible"
        >
          {/* Left: copy */}
          <motion.div variants={fadeUp} custom={0} className="space-y-6">
            {/* Eyebrow */}
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
              style={{
                background: "hsl(126 15% 28% / 0.10)",
                color: "hsl(126 15% 28%)",
              }}
            >
              {copy.eyebrow}
            </span>

            {/* Headline */}
            <h1
              className="font-display leading-[1.08] tracking-[0.02em]"
              style={{ fontSize: "clamp(2.6rem, 6.5vw, 4.8rem)" }}
            >
              {copy.headline}
            </h1>

            {/* Subheadline */}
            <p
              className="max-w-lg text-[1.05rem] leading-7"
              style={{ color: "hsl(210 8% 40%)" }}
            >
              {copy.subheadline}
            </p>

            {/* Primary CTA */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  trackEvent("landing_cta_clicked", { variant, cta: "hero_primary", mode: "signup" });
                  openAuth("signup", "hero_primary");
                }}
                className="inline-flex items-center gap-2.5 rounded-xl px-7 py-4 text-base font-bold shadow-lg transition-all hover:shadow-xl hover:brightness-105 active:scale-[0.98]"
                style={{
                  background: "hsl(28 71% 57%)",
                  color: "#fff",
                  boxShadow: "0 4px 20px hsl(28 71% 57% / 0.40)",
                }}
              >
                {copy.primaryCta}
                <ArrowIcon size={17} strokeWidth={2.5} />
              </button>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {copy.trust.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: "hsl(210 8% 45%)" }}
                  >
                    <Check
                      size={12}
                      strokeWidth={2.5}
                      style={{ color: "hsl(126 15% 35%)" }}
                    />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Secondary: already have account */}
            <p className="text-sm" style={{ color: "hsl(210 8% 50%)" }}>
              {isHe ? "כבר קורא ב-AMUD? " : "Already on AMUD? "}
              <button
                onClick={() => openAuth("login", "hero_login")}
                className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                style={{ color: "hsl(126 15% 28%)" }}
              >
                {isHe ? "להתחבר" : "Sign in"}
              </button>
            </p>
          </motion.div>

          {/* Right: app mockup */}
          <motion.div
            variants={fadeUp}
            custom={1}
            className="flex justify-center lg:justify-end"
          >
            <AppMockup lang={lang} />
          </motion.div>
        </motion.section>

        {/* ── PROOF PILLS ───────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="flex flex-wrap justify-center gap-3 py-6 border-y"
          style={{ borderColor: "hsl(44 12% 74%)" }}
        >
          {copy.proofItems.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{
                background: "hsl(44 22% 90%)",
                border: "1px solid hsl(44 12% 74%)",
                color: "hsl(210 8% 35%)",
              }}
            >
              <Icon size={14} style={{ color: "hsl(126 15% 28%)" }} />
              {label}
            </div>
          ))}
        </motion.div>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <motion.section
          className="py-16 space-y-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="font-display text-center text-2xl sm:text-3xl tracking-wide"
          >
            {copy.stepsTitle}
          </motion.h2>

          <div className="grid gap-5 sm:grid-cols-3">
            {copy.steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                custom={i + 1}
                className="relative rounded-2xl p-6 space-y-3"
                style={{
                  background: "hsl(44 22% 90%)",
                  border: "1px solid hsl(44 12% 74%)",
                }}
              >
                <span
                  className="font-display text-4xl font-bold leading-none"
                  style={{ color: "hsl(126 15% 28% / 0.18)" }}
                >
                  {step.num}
                </span>
                <p className="font-semibold text-base">{step.title}</p>
                <p
                  className="text-sm leading-6"
                  style={{ color: "hsl(210 8% 44%)" }}
                >
                  {step.desc}
                </p>
                {i < copy.steps.length - 1 && (
                  <div
                    className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: "hsl(44 12% 70%)" }}
                  >
                    {dir === "rtl" ? (
                      <ArrowLeft size={16} strokeWidth={1.5} />
                    ) : (
                      <ArrowRight size={16} strokeWidth={1.5} />
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Inline CTA after steps */}
          <motion.div variants={fadeUp} custom={4} className="flex justify-center">
            <button
              onClick={() => openAuth("signup", "steps_cta")}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all hover:brightness-105"
              style={{
                background: "hsl(126 15% 28%)",
                color: "hsl(44 30% 93%)",
              }}
            >
              {copy.primaryCta}
              <ArrowIcon size={14} strokeWidth={2.5} />
            </button>
          </motion.div>
        </motion.section>

        {/* ── BENEFITS ──────────────────────────────────────────────────────── */}
        <motion.section
          className="py-4 pb-16 space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="font-display text-center text-2xl sm:text-3xl tracking-wide"
          >
            {copy.benefitsTitle}
          </motion.h2>

          <div className="grid gap-5 sm:grid-cols-3">
            {copy.benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="rounded-2xl p-6 space-y-3"
                  style={{
                    background: "hsl(44 22% 90%)",
                    border: "1px solid hsl(44 12% 74%)",
                  }}
                >
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ background: "hsl(126 15% 28% / 0.10)" }}
                  >
                    <Icon
                      size={20}
                      style={{ color: "hsl(126 15% 28%)" }}
                      strokeWidth={1.8}
                    />
                  </div>
                  <p className="font-semibold text-base leading-snug">{b.title}</p>
                  <p
                    className="text-sm leading-6"
                    style={{ color: "hsl(210 8% 44%)" }}
                  >
                    {b.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(126 15% 24%) 0%, hsl(126 22% 32%) 60%, hsl(188 60% 28%) 100%)",
              boxShadow: "0 20px 60px hsl(126 15% 12% / 0.35)",
            }}
          >
            <div className="px-8 py-14 text-center space-y-6" style={{ color: "hsl(44 30% 93%)" }}>
              {/* Decoration */}
              <div className="flex justify-center gap-1 text-2xl">
                <span style={{ opacity: 0.5 }}>📚</span>
                <span style={{ opacity: 0.8 }}>📚</span>
                <span>📚</span>
                <span style={{ opacity: 0.8 }}>📚</span>
                <span style={{ opacity: 0.5 }}>📚</span>
              </div>

              <h2
                className="font-display text-2xl sm:text-4xl tracking-wide max-w-lg mx-auto"
                style={{ lineHeight: 1.15 }}
              >
                {copy.finalHeadline}
              </h2>

              <p
                className="text-sm sm:text-base max-w-md mx-auto"
                style={{ color: "hsl(44 30% 80%)" }}
              >
                {copy.finalSub}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => openAuth("signup", "final_cta")}
                  className="inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "hsl(28 71% 57%)",
                    color: "#fff",
                    boxShadow: "0 4px 24px hsl(28 71% 45% / 0.5)",
                  }}
                >
                  {copy.finalCta}
                  <ArrowIcon size={17} strokeWidth={2.5} />
                </button>
              </div>

              {/* Trust micro-copy */}
              <p className="text-xs" style={{ color: "hsl(44 30% 65%)" }}>
                {isHe
                  ? "התחלה חינמית · ללא כרטיס אשראי · הרשמה ב-30 שניות"
                  : "Free to start · No credit card · Sign up in 30 seconds"}
              </p>
            </div>
          </motion.div>
        </motion.section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer
        className="border-t py-8 text-center"
        style={{ borderColor: "hsl(44 12% 74%)" }}
      >
        <p
          className="text-xs"
          style={{ color: "hsl(210 8% 55%)" }}
        >
          {t.landing.footer}
        </p>
      </footer>
    </div>
  );
}
