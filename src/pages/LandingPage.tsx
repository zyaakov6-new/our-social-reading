import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  Quote,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
    transition: { delay: i * 0.07, duration: 0.5, ease: "easeOut" },
  }),
};

// Inline phone mockup (illustrative, adapts to language)
const AppMockup = ({ lang }: { lang: string }) => {
  const isHe = lang === "he";
  const days = isHe
    ? ["א", "ב", "ג", "ד", "ה", "ו", "ש"]
    : ["M", "T", "W", "T", "F", "S", "S"];
  const activeDays = [0, 1, 2, 4, 5];

  return (
    <div className="relative mx-auto w-[220px] sm:w-[256px] select-none">
      {/* Floating streak chip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", damping: 12 }}
        className={`absolute -top-3 z-20 ${isHe ? "-left-4" : "-right-4"} flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-lg`}
        style={{ background: "#fff", border: "1px solid hsl(44 15% 80%)" }}
      >
        <Flame size={14} style={{ color: "hsl(28 71% 57%)" }} />
        <span className="text-xs font-extrabold" style={{ color: "hsl(210 11% 18%)" }}>
          {isHe ? "7 ימי רצף" : "7 day streak"}
        </span>
      </motion.div>

      {/* Ambient glow */}
      <div
        className="absolute -inset-12 -z-10 rounded-full blur-3xl"
        style={{ background: "hsl(126 15% 28% / 0.18)" }}
      />
      {/* Phone shell */}
      <div
        className="rounded-[2.7rem] p-[6px] shadow-2xl"
        style={{
          background: "hsl(210 11% 16%)",
          boxShadow: "0 36px 90px hsl(126 15% 10% / 0.5), 0 0 0 1px hsl(0 0% 100% / 0.08)",
        }}
      >
        {/* Screen */}
        <div
          className="rounded-[2.25rem] overflow-hidden"
          style={{ background: "hsl(44 27% 84%)" }}
        >
          {/* Dynamic island */}
          <div className="flex justify-center pt-2 pb-1">
            <div
              className="h-[5px] w-[72px] rounded-full"
              style={{ background: "hsl(210 11% 16%)" }}
            />
          </div>

          {/* App top bar */}
          <div className="flex items-center justify-between px-4 py-1.5">
            <span className="text-[9px] font-bold" style={{ color: "hsl(28 71% 57%)" }}>
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
              style={{ background: "hsl(126 15% 28%)", color: "hsl(44 30% 93%)" }}
            >
              {isHe ? "מ" : "M"}
            </div>
          </div>

          <div className="mx-3 h-px" style={{ background: "hsl(44 12% 74%)" }} />

          {/* Feed card 1 (current user) */}
          <div
            className="mx-3 mt-2.5 rounded-2xl overflow-hidden"
            style={{ border: "1px solid hsl(44 15% 78%)", background: "hsl(44 22% 90%)" }}
          >
            <div
              className="flex items-center justify-between px-3 py-1.5"
              style={{ background: "hsl(44 18% 86%)" }}
            >
              <span style={{ fontSize: 8, color: "hsl(210 8% 55%)" }}>
                {isHe ? "לפני שעה" : "1 hour ago"}
              </span>
              <span className="text-[9px] font-bold" style={{ color: "hsl(28 71% 57%)" }}>
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
                  {isHe ? "אלף שמשות זוהרות" : "The Alchemist"}
                </p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <span
                    className="text-[8px] rounded-full px-1.5 py-0.5 font-medium"
                    style={{ background: "hsl(126 15% 28% / 0.12)", color: "hsl(126 15% 28%)" }}
                  >
                    ⏱ 25 {isHe ? "דק׳" : "min"}
                  </span>
                  <span
                    className="text-[8px] rounded-full px-1.5 py-0.5 font-medium"
                    style={{ background: "hsl(188 100% 27% / 0.10)", color: "hsl(188 60% 30%)" }}
                  >
                    62%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feed card 2 (friend) */}
          <div
            className="mx-3 mt-1.5 rounded-2xl overflow-hidden"
            style={{ border: "1px solid hsl(44 15% 78%)", background: "hsl(44 22% 90%)" }}
          >
            <div
              className="flex items-center justify-between px-3 py-1.5"
              style={{ background: "hsl(44 18% 86%)" }}
            >
              <span style={{ fontSize: 8, color: "hsl(210 8% 55%)" }}>
                {isHe ? "לפני 3 ש׳" : "3 hrs ago"}
              </span>
              <span className="text-[9px] font-semibold" style={{ color: "hsl(210 11% 14%)" }}>
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
                    style={{ background: "hsl(126 15% 28% / 0.12)", color: "hsl(126 15% 28%)" }}
                  >
                    ⏱ 40 {isHe ? "דק׳" : "min"}
                  </span>
                  <span
                    className="text-[8px] rounded-full px-1.5 py-0.5 font-medium"
                    style={{ background: "hsl(188 100% 27% / 0.10)", color: "hsl(188 60% 30%)" }}
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
            style={{ background: "hsl(44 22% 90%)", border: "1px solid hsl(44 15% 78%)" }}
          >
            <p className="text-[8px] font-semibold mb-1.5" style={{ color: "hsl(210 8% 48%)" }}>
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
                  <span style={{ fontSize: 6, color: "hsl(210 8% 55%)" }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Real app screenshot in a phone frame
const ScreenshotFrame = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative mx-auto w-[210px] sm:w-[236px] select-none transition-transform duration-300 hover:-translate-y-1.5">
    <div
      className="rounded-[2.2rem] p-[6px]"
      style={{
        background: "hsl(210 11% 16%)",
        boxShadow: "0 26px 64px hsl(126 15% 10% / 0.34), 0 0 0 1px hsl(0 0% 100% / 0.06)",
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="rounded-[1.9rem] w-full block"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { lang, dir, t } = useLanguage();
  const [variant] = useState<LandingExperimentVariant>(() => getStoredLandingVariant());

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;
  const isHe = lang === "he";

  const copy = useMemo(() => {
    if (isHe) {
      return {
        eyebrow: "מעקב קריאה חברתי · בעברית",
        headline: "סוף סוף תסיים את הספרים שהתחלת.",
        subheadline:
          "AMUD הופך קריאה להרגל יומי. תיעוד של 20 שניות, רצף שבא לך לשמור עליו, וחברים שקוראים לצידך.",
        primaryCta: "מתחילים בחינם",
        secondaryCta: "להציץ בלי הרשמה",
        loginLink: "יש לי כבר חשבון",
        trust: ["התחלה חינמית", "הרשמה ב-30 שניות", "ללא כרטיס אשראי"],
        proofItems: [
          { icon: Flame, label: "רצף קריאה יומי" },
          { icon: Users, label: "חברים שמניעים" },
          { icon: Trophy, label: "אתגרים ודירוג" },
        ],
        showcaseTitle: "ככה זה נראה",
        showcaseSub: "כל מה שאתה קורא, במקום אחד. פשוט ויפה, בעברית.",
        shots: [
          {
            src: "/screenshot-mobile-1.png",
            alt: "מסך הבית של AMUD",
            caption: "הבית שלך: ספרים, רצף ויעדים במקום אחד",
          },
          {
            src: "/screenshot-mobile-2.png",
            alt: "מסך האתגרים של AMUD",
            caption: "אתגרים: תתחרה, תוביל, תקרא יותר",
          },
        ],
        stepsTitle: "שלושה צעדים ואתה בפנים",
        steps: [
          {
            num: "01",
            title: "מחפשים ספר",
            desc: "מקלידים שם ורואים תוצאות מיידיות ממיליוני ספרים",
          },
          {
            num: "02",
            title: "רושמים קריאה",
            desc: "כמה דקות קראת? באיזה עמוד אתה? זהו, 20 שניות וסיימת.",
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
            desc: "נגמר ה'באיזה עמוד הייתי?'. כל ספר שלך עם התקדמות מדויקת.",
          },
          {
            icon: Users,
            title: "חברים הופכים את זה לכיף",
            desc: "ראה מה חבריך קוראים, השאר לייק, השתתף באתגרים משותפים.",
          },
          {
            icon: Flame,
            title: "הרצף עושה את העבודה",
            desc: "הרגל קריאה נבנה מעקביות, לא ממרתונים. אפילו דקה ביום עושה את ההבדל.",
          },
        ],
        founderTitle: "למה בנינו את AMUD",
        founderBody:
          "לפני שנה ספרתי כמה ספרים נטשתי באמצע. הגעתי ל-30. לא בגלל שהם היו משעממים, פשוט אף פעם לא הפכתי קריאה להרגל. בניתי את AMUD קודם כל לעצמי: משהו קטן לסמן בו כל יום, רצף שלא בא לי לשבור, וחברים שהופכים את זה לכיף. אם זה נשמע לך מוכר, זה בדיוק בשבילך.",
        founderSign: "זיו, מייסד AMUD",
        faqTitle: "שאלות נפוצות",
        faqs: [
          {
            q: "כמה זה עולה?",
            a: "ההתחלה חינמית לגמרי: מעקב ספרים, רצף יומי, יעדים וחברים. יש גם תוכנית PRO עם תכונות מתקדמות, אבל כל מה שצריך כדי לבנות הרגל קריאה זמין בחינם וללא כרטיס אשראי.",
          },
          {
            q: "החברים שלי חייבים להצטרף?",
            a: "ממש לא. AMUD עובד מצוין גם לבד, הרצף והיעדים הם שלך. כשחברים מצטרפים, האתגרים והדירוג רק הופכים את זה לכיף יותר.",
          },
          {
            q: "מה עם הפרטיות שלי?",
            a: "אתה שולט במה שגלוי. אפשר להפוך את הפרופיל לפרטי בכל רגע מההגדרות. האימייל, הסיסמה וההתחברות תמיד נשארים פרטיים.",
          },
          {
            q: "אילו ספרים יש? גם בעברית?",
            a: "מיליוני ספרים דרך Google Books, בעברית ובכל שפה. לא מצאת ספר? אפשר להוסיף אותו ידנית בכמה שניות.",
          },
          {
            q: "צריך להתקין משהו?",
            a: "לא. AMUD עובד ישר בדפדפן. אפשר גם להוסיף אותו למסך הבית כאפליקציה, או להוריד מ-Google Play.",
          },
        ],
        finalHeadline: "ספר אחד. יום אחד. הרגל שנשאר.",
        finalSub: "כל מסע קריאה מתחיל בעמוד אחד. תתחיל את שלך היום.",
        finalCta: "מתחילים עכשיו, בחינם",
        stickyCta: "מתחילים בחינם",
      };
    }
    return {
      eyebrow: "Social reading tracker",
      headline: "Finally finish the books you start.",
      subheadline:
        "AMUD turns reading into a daily habit. A 20-second log, a streak you'll want to protect, and friends reading right beside you.",
      primaryCta: "Start free",
      secondaryCta: "Look around first",
      loginLink: "I already have an account",
      trust: ["Free to start", "Sign up in 30 seconds", "No credit card"],
      proofItems: [
        { icon: Flame, label: "Daily reading streak" },
        { icon: Users, label: "Friends who motivate" },
        { icon: Trophy, label: "Challenges & rankings" },
      ],
      showcaseTitle: "Here's what it looks like",
      showcaseSub: "Everything you read, in one place. Simple and beautiful.",
      shots: [
        {
          src: "/screenshot-mobile-1.png",
          alt: "AMUD home screen",
          caption: "Your home: books, streak, and goals in one place",
        },
        {
          src: "/screenshot-mobile-2.png",
          alt: "AMUD challenges screen",
          caption: "Challenges: compete, lead, read more",
        },
      ],
      stepsTitle: "Three steps and you're in",
      steps: [
        {
          num: "01",
          title: "Search a book",
          desc: "Type a title and see instant results from millions of books",
        },
        {
          num: "02",
          title: "Log your reading",
          desc: "How many minutes? What page? That's it, 20 seconds and you're done.",
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
          desc: "Reading habits come from consistency, not marathons. Even a minute a day counts.",
        },
      ],
      founderTitle: "Why we built AMUD",
      founderBody:
        "A year ago I counted how many books I'd abandoned halfway. I got to 30. Not because they were boring, I just never turned reading into a habit. I built AMUD for myself first: something small to check off every day, a streak I didn't want to break, and friends who make it fun. If that sounds familiar, it's exactly for you.",
      founderSign: "Ziv, founder of AMUD",
      faqTitle: "Frequently asked",
      faqs: [
        {
          q: "How much does it cost?",
          a: "Getting started is completely free: book tracking, daily streaks, goals, and friends. There's a PRO plan with advanced features, but everything you need to build a reading habit is free, no credit card required.",
        },
        {
          q: "Do my friends have to join?",
          a: "Not at all. AMUD works great solo, your streak and goals are yours. When friends join, challenges and rankings just make it more fun.",
        },
        {
          q: "Is my data private?",
          a: "You control what's visible. You can make your profile private anytime from settings. Your email, password, and login always stay private.",
        },
        {
          q: "Which books are available?",
          a: "Millions of books via Google Books, in any language. Can't find one? Add it manually in seconds.",
        },
        {
          q: "Do I need to install anything?",
          a: "No. AMUD runs right in your browser. You can also add it to your home screen as an app, or download it from Google Play.",
        },
      ],
      finalHeadline: "One book. One day. A habit that sticks.",
      finalSub: "Every reading journey starts with one page. Start yours today.",
      finalCta: "Start now, it's free",
      stickyCta: "Start free",
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

  const openGuest = (cta: string) => {
    trackEvent("landing_cta_clicked", { variant, cta, mode: "guest" });
    navigate("/feed");
  };

  return (
    <div dir={dir} className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Ambient background wash */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "hsl(126 22% 40% / 0.16)" }}
        />
        <div
          className="absolute top-[40%] left-[-15%] h-[480px] w-[480px] rounded-full blur-3xl"
          style={{ background: "hsl(188 60% 35% / 0.10)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[5%] h-[360px] w-[360px] rounded-full blur-3xl"
          style={{ background: "hsl(28 71% 57% / 0.08)" }}
        />
      </div>

      {/* NAV */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ background: "hsl(44 27% 84% / 0.85)", borderColor: "hsl(44 12% 74% / 0.7)" }}
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
            <button
              onClick={() => openAuth("signup", "header_signup")}
              className="hidden sm:inline-flex items-center rounded-lg px-4 py-1.5 text-sm font-bold shadow-sm transition-all hover:brightness-105 active:scale-95"
              style={{ background: "hsl(28 71% 57%)", color: "#fff" }}
            >
              {copy.primaryCta}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 sm:pb-24">
        {/* HERO */}
        <motion.section
          className="grid gap-8 pt-10 pb-14 sm:pt-14 sm:pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16"
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} custom={0} className="space-y-5 sm:space-y-6">
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
              style={{ background: "hsl(126 15% 28% / 0.10)", color: "hsl(126 15% 28%)" }}
            >
              {copy.eyebrow}
            </span>

            <h1
              className="font-display leading-[1.08] tracking-[0.01em]"
              style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}
            >
              {copy.headline}
            </h1>

            <p className="max-w-lg text-[1.05rem] leading-7" style={{ color: "hsl(210 8% 38%)" }}>
              {copy.subheadline}
            </p>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => openAuth("signup", "hero_primary")}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl px-7 py-4 text-base font-bold shadow-lg transition-all hover:shadow-xl hover:brightness-105 active:scale-[0.98]"
                  style={{
                    background: "hsl(28 71% 57%)",
                    color: "#fff",
                    boxShadow: "0 6px 24px hsl(28 71% 57% / 0.42)",
                  }}
                >
                  {copy.primaryCta}
                  <ArrowIcon
                    size={17}
                    strokeWidth={2.5}
                    className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  />
                </button>

                <button
                  onClick={() => openGuest("hero_guest")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all hover:bg-black/[0.04]"
                  style={{ border: "1.5px solid hsl(126 15% 28% / 0.30)", color: "hsl(126 15% 28%)" }}
                >
                  {copy.secondaryCta}
                </button>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {copy.trust.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: "hsl(210 8% 45%)" }}
                  >
                    <Check size={12} strokeWidth={2.5} style={{ color: "hsl(126 15% 35%)" }} />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="flex justify-center lg:justify-end">
            <AppMockup lang={lang} />
          </motion.div>
        </motion.section>

        {/* PROOF PILLS */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="flex flex-wrap justify-center gap-3 py-6 border-y"
          style={{ borderColor: "hsl(44 12% 74% / 0.7)" }}
        >
          {copy.proofItems.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm"
              style={{
                background: "hsl(44 30% 94%)",
                border: "1px solid hsl(44 12% 74%)",
                color: "hsl(210 8% 32%)",
              }}
            >
              <Icon size={14} style={{ color: "hsl(126 15% 28%)" }} />
              {label}
            </div>
          ))}
        </motion.div>

        {/* SCREENSHOT SHOWCASE */}
        <motion.section
          className="py-16 space-y-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeUp} custom={0} className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl tracking-wide">{copy.showcaseTitle}</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: "hsl(210 8% 42%)" }}>
              {copy.showcaseSub}
            </p>
          </motion.div>

          <div className="grid gap-10 sm:gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            {copy.shots.map((shot, i) => (
              <motion.div
                key={shot.src}
                variants={fadeUp}
                custom={i + 1}
                className="flex flex-col items-center gap-4"
              >
                <ScreenshotFrame src={shot.src} alt={shot.alt} />
                <p className="text-sm text-center max-w-[230px]" style={{ color: "hsl(210 8% 40%)" }}>
                  {shot.caption}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* HOW IT WORKS */}
        <motion.section
          className="py-12 space-y-10"
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
                className="relative rounded-2xl p-6 space-y-3 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                style={{ background: "hsl(44 30% 94%)", border: "1px solid hsl(44 12% 74%)" }}
              >
                <span
                  className="font-display text-4xl font-bold leading-none"
                  style={{ color: "hsl(126 15% 28% / 0.20)" }}
                >
                  {step.num}
                </span>
                <p className="font-semibold text-base">{step.title}</p>
                <p className="text-sm leading-6" style={{ color: "hsl(210 8% 42%)" }}>
                  {step.desc}
                </p>
                {i < copy.steps.length - 1 && (
                  <div
                    className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: "hsl(44 12% 68%)" }}
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

          <motion.div variants={fadeUp} custom={4} className="flex justify-center">
            <button
              onClick={() => openAuth("signup", "steps_cta")}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-sm transition-all hover:brightness-105 active:scale-95"
              style={{ background: "hsl(126 15% 28%)", color: "hsl(44 30% 93%)" }}
            >
              {copy.primaryCta}
              <ArrowIcon size={14} strokeWidth={2.5} />
            </button>
          </motion.div>
        </motion.section>

        {/* BENEFITS */}
        <motion.section
          className="py-4 pb-14 space-y-8"
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
                  className="rounded-2xl p-6 space-y-3 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                  style={{ background: "hsl(44 30% 94%)", border: "1px solid hsl(44 12% 74%)" }}
                >
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ background: "hsl(126 15% 28% / 0.10)" }}
                  >
                    <Icon size={20} style={{ color: "hsl(126 15% 28%)" }} strokeWidth={1.8} />
                  </div>
                  <p className="font-semibold text-base leading-snug">{b.title}</p>
                  <p className="text-sm leading-6" style={{ color: "hsl(210 8% 42%)" }}>
                    {b.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* FOUNDER NOTE */}
        <motion.section
          className="py-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="relative mx-auto max-w-2xl rounded-3xl p-8 sm:p-10 shadow-sm"
            style={{ background: "hsl(44 30% 94%)", border: "1px solid hsl(44 12% 74%)" }}
          >
            <Quote size={32} className="mb-3" style={{ color: "hsl(126 15% 28% / 0.30)" }} />
            <h2 className="font-display text-xl sm:text-2xl tracking-wide mb-3">
              {copy.founderTitle}
            </h2>
            <p className="text-base leading-7" style={{ color: "hsl(210 8% 34%)" }}>
              {copy.founderBody}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: "hsl(126 15% 28%)", color: "hsl(44 30% 93%)" }}
              >
                {isHe ? "ז" : "Z"}
              </div>
              <p className="text-sm font-semibold" style={{ color: "hsl(126 15% 28%)" }}>
                {copy.founderSign}
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          className="py-12 space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="font-display text-center text-2xl sm:text-3xl tracking-wide"
          >
            {copy.faqTitle}
          </motion.h2>

          <motion.div variants={fadeUp} custom={1} className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {copy.faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  style={{ borderColor: "hsl(44 12% 74%)" }}
                >
                  <AccordionTrigger className="text-start text-base font-semibold hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent
                    className="text-sm leading-6"
                    style={{ color: "hsl(210 8% 40%)" }}
                  >
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.section>

        {/* FINAL CTA */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="relative rounded-3xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, hsl(126 15% 22%) 0%, hsl(126 22% 30%) 55%, hsl(188 60% 26%) 100%)",
              boxShadow: "0 24px 70px hsl(126 15% 12% / 0.4)",
            }}
          >
            {/* subtle texture dots */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: "radial-gradient(hsl(44 30% 93%) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            <div
              className="relative px-8 py-14 text-center space-y-6"
              style={{ color: "hsl(44 30% 93%)" }}
            >
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

              <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: "hsl(44 30% 80%)" }}>
                {copy.finalSub}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => openAuth("signup", "final_cta")}
                  className="group inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "hsl(28 71% 57%)",
                    color: "#fff",
                    boxShadow: "0 6px 26px hsl(28 71% 45% / 0.5)",
                  }}
                >
                  {copy.finalCta}
                  <ArrowIcon
                    size={17}
                    strokeWidth={2.5}
                    className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  />
                </button>

                <button
                  onClick={() => openGuest("final_guest")}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all hover:bg-white/10"
                  style={{ border: "1.5px solid hsl(44 30% 93% / 0.35)", color: "hsl(44 30% 93%)" }}
                >
                  {copy.secondaryCta}
                </button>
              </div>

              <p className="text-xs" style={{ color: "hsl(44 30% 65%)" }}>
                {isHe
                  ? "התחלה חינמית · ללא כרטיס אשראי · הרשמה ב-30 שניות"
                  : "Free to start · No credit card · Sign up in 30 seconds"}
              </p>
            </div>
          </motion.div>
        </motion.section>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-8 text-center" style={{ borderColor: "hsl(44 12% 74% / 0.7)" }}>
        <p className="text-xs" style={{ color: "hsl(210 8% 55%)" }}>
          {t.landing.footer}
        </p>
      </footer>

      {/* Sticky mobile CTA bar */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pt-3 backdrop-blur-md border-t"
        style={{
          background: "hsl(44 27% 84% / 0.92)",
          borderColor: "hsl(44 12% 74%)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        }}
      >
        <button
          onClick={() => openAuth("signup", "sticky_mobile")}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold shadow-lg active:scale-[0.98] transition-transform"
          style={{ background: "hsl(28 71% 57%)", color: "#fff" }}
        >
          {copy.stickyCta}
          <ArrowIcon size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
