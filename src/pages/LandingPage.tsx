import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Medal,
  Search,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { trackEvent } from "@/lib/analytics";
import { buildAuthPath, storeAuthIntent } from "@/lib/auth-flow";
import {
  getStoredLandingVariant,
  type LandingExperimentVariant,
} from "@/lib/experiments";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.07, duration: 0.4, ease: "easeOut" },
  }),
};

const sampleReaders = [
  { name: "Maya", minutes: 210, rank: 1 },
  { name: "Noa", minutes: 165, rank: 2 },
  { name: "Roni", minutes: 120, rank: 3 },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { lang, dir, t } = useLanguage();
  const [variant] = useState<LandingExperimentVariant>(() => getStoredLandingVariant());

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const copy = useMemo(
    () =>
      lang === "he"
        ? {
            eyebrow: "אפליקציית קריאה חברתית",
            headline: "לקרוא יותר עם חברים.",
            subheadline:
              variant === "guest_first"
                ? "נסו את AMUD עם ספר אחד. חפשו כותר, תראו איך זה עובד, ותתחברו רק כשאתם רוצים לשמור."
                : "בנו רצף קריאה שנשאר. תעדו דקות, התקדמו מול חברים, וסיימו יותר ספרים השנה.",
            primaryCta:
              variant === "guest_first" ? "נסו עם ספר אחד" : "הצטרפו בחינם",
            secondaryCta:
              variant === "guest_first" ? "ליצירת חשבון חינם" : "לנסות בלי הרשמה",
            proofTitle: "כך AMUD עובד בדקה הראשונה",
            proofBody:
              "חיפוש ספר, רישום דקות, ורצף שממשיך מחר. התוכן למטה הוא הדגמה של החוויה, לא נתונים חיים.",
            stepCards: [
              { icon: Search, title: "מחפשים ספר", desc: "מקלידים שם ספר או מחבר ורואים תוצאות מיד" },
              { icon: Clock3, title: "רושמים דקות", desc: "רישום יומי מהיר בלי עומס או טפסים ארוכים" },
              { icon: Medal, title: "שומרים על רצף", desc: "עולים בטבלה, נשארים עקביים, ומסיימים יותר" },
            ],
            sampleLabel: "דוגמה",
            sampleLeaderboard: "טבלת דירוג לדוגמה",
            sampleNote: "כך נראית תחרות שבועית בין חברים",
            sampleStreakTitle: "מה תרוויחו",
            sampleStreakItems: [
              "רצף קריאה יומי",
              "חברים, אתגרים ודירוג",
              "ספרייה אישית ומעקב התקדמות",
            ],
            honestyBadge: "תצוגה מקדימה אמיתית",
            finalTitle: "תתחילו עם ספר אחד כבר היום.",
            finalBody:
              "חפשו כותר, תעדו את הדקות הראשונות שלכם, ופתחו חשבון חינם רק כשתרצו לשמור את ההתקדמות.",
            login: "כניסה",
            previewFeed: "לצפייה בפיד הקוראים",
            tryNote: "לא צריך להירשם כדי לנסות חיפוש ספר",
          }
        : {
            eyebrow: "Social reading app",
            headline: "Read more with friends.",
            subheadline:
              variant === "guest_first"
                ? "Try AMUD with one book. Search a title, feel the flow, and only sign up when you want to save it."
                : "Build a reading streak that sticks. Log minutes, compete with friends, and finish more books this year.",
            primaryCta:
              variant === "guest_first" ? "Try with one book" : "Join free",
            secondaryCta:
              variant === "guest_first" ? "Create a free account" : "Try without signing up",
            proofTitle: "What happens in the first minute",
            proofBody:
              "Search a book, log minutes, and build a streak you want to keep. The content below is a sample preview, not live user stats.",
            stepCards: [
              { icon: Search, title: "Search a book", desc: "Type a title or author and see results right away" },
              { icon: Clock3, title: "Log minutes", desc: "A fast daily check-in without a long form" },
              { icon: Medal, title: "Keep your streak", desc: "Climb the board, stay consistent, and finish more" },
            ],
            sampleLabel: "Sample",
            sampleLeaderboard: "Sample leaderboard",
            sampleNote: "A preview of what a weekly reading race looks like",
            sampleStreakTitle: "What you unlock",
            sampleStreakItems: [
              "A daily reading streak",
              "Friends, challenges, and rankings",
              "A personal library with progress tracking",
            ],
            honestyBadge: "Honest preview",
            finalTitle: "Start with one book today.",
            finalBody:
              "Search a title, log your first minutes, and create a free account when you want to keep the progress.",
            login: "Login",
            previewFeed: "See the reader feed",
            tryNote: "No signup needed to try a book search",
          },
    [lang, variant],
  );

  useEffect(() => {
    trackEvent("landing_viewed", {
      variant,
      locale: lang,
    });
  }, [lang, variant]);

  const startTrial = () => {
    trackEvent("landing_cta_clicked", {
      variant,
      cta: "trial",
    });

    navigate(`/search?source=landing&variant=${variant}`);
  };

  const openAuth = (mode: "signup" | "login", cta: string) => {
    storeAuthIntent({
      source: "landing",
      variant,
      mode,
      next: "/",
      action: cta,
    });

    trackEvent("landing_cta_clicked", {
      variant,
      cta,
      mode,
    });

    navigate(
      buildAuthPath(mode, {
        next: "/",
        source: "landing",
        variant,
        action: cta,
      }),
    );
  };

  const primaryAction =
    variant === "guest_first"
      ? () => startTrial()
      : () => openAuth("signup", "hero_join");

  const secondaryAction =
    variant === "guest_first"
      ? () => openAuth("signup", "hero_join_secondary")
      : () => startTrial();

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="block h-6 w-[3px] flex-shrink-0 rounded-full bg-primary" />
            <span className="font-display text-xl tracking-[0.18em] text-primary">AMUD</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAuth("login", "header_login")}
              className="touch-manipulation font-semibold"
            >
              {copy.login}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <motion.section
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="space-y-5"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                  {copy.eyebrow}
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-[clamp(2.2rem,6vw,4.5rem)] leading-[1.05] tracking-[0.02em] text-foreground">
                  {copy.headline}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  {copy.subheadline}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="gap-2 text-base font-bold shadow-md shadow-primary/20"
                  onClick={primaryAction}
                >
                  {copy.primaryCta}
                  <ArrowIcon size={16} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base font-semibold"
                  onClick={secondaryAction}
                >
                  {copy.secondaryCta}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                <span>{copy.tryNote}</span>
              </div>
            </div>

            <Card className="border-border/60 bg-card/70 shadow-sm">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                    {copy.honestyBadge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{copy.proofTitle}</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">{copy.proofBody}</p>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {copy.stepCards.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="space-y-4"
          >
            <Card className="overflow-hidden border-border/60 shadow-lg">
              <div className="border-b bg-primary px-5 py-4 text-primary-foreground">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{copy.sampleLeaderboard}</p>
                    <p className="text-xs text-primary-foreground/75">{copy.sampleNote}</p>
                  </div>
                  <Badge className="border-0 bg-primary-foreground/15 text-[10px] text-primary-foreground">
                    {copy.sampleLabel}
                  </Badge>
                </div>
              </div>

              <CardContent className="space-y-3 p-5">
                {sampleReaders.map((reader, index) => (
                  <div key={reader.name}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {reader.rank}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{reader.name}</p>
                        <p className="text-xs text-muted-foreground">{reader.minutes} min this week</p>
                      </div>
                      <Medal className="h-4 w-4 text-[hsl(28_71%_57%)]" />
                    </div>
                    {index < sampleReaders.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{copy.sampleStreakTitle}</p>
                </div>
                <div className="space-y-3">
                  {copy.sampleStreakItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => {
                    trackEvent("landing_cta_clicked", {
                      variant,
                      cta: "preview_feed",
                    });
                    navigate("/feed");
                  }}
                >
                  {copy.previewFeed}
                  <ArrowIcon className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-8"
        >
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="space-y-4 bg-primary px-6 py-10 text-center text-primary-foreground">
              <div className="flex items-center justify-center gap-2 text-xs text-primary-foreground/70">
                <BookOpen className="h-4 w-4" />
                <span>{copy.finalTitle}</span>
              </div>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-primary-foreground/80">
                {copy.finalBody}
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-[hsl(28_71%_57%)] font-bold text-white hover:bg-[hsl(28_71%_50%)]"
                  onClick={startTrial}
                >
                  {lang === "he" ? "לנסות חיפוש ספר" : "Try a book search"}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="font-semibold"
                  onClick={() => openAuth("signup", "final_join")}
                >
                  {lang === "he" ? "לפתוח חשבון חינם" : "Create a free account"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.section>
      </main>

      <footer className="border-t py-6 text-center">
        <p className="text-xs text-muted-foreground">{t.landing.footer}</p>
      </footer>
    </div>
  );
}
