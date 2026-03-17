import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type IllustrationProps = {
  className?: string;
};

const CozyBookIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <path
      d="M14 16.5c0-2.5 2-4.5 4.5-4.5H32v36H18.5a4.5 4.5 0 01-4.5-4.5v-27z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M50 16.5c0-2.5-2-4.5-4.5-4.5H32v36h13.5a4.5 4.5 0 004.5-4.5v-27z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M22 23h6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M36 23h6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const FriendlyChallengeIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <path
      d="M19 14h26v10a10 10 0 01-10 10h-6a10 10 0 01-10-10V14z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 49h16M32 34v15"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M19 18h-3a4 4 0 000 8h3M45 18h3a4 4 0 010 8h-3"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FriendsCircleIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <circle cx="32" cy="21" r="8" stroke="currentColor" strokeWidth="3" />
    <path
      d="M18 47c1.5-8 7.5-12 14-12s12.5 4 14 12"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="14" cy="25" r="5" stroke="currentColor" strokeWidth="3" />
    <circle cx="50" cy="25" r="5" stroke="currentColor" strokeWidth="3" />
  </svg>
);

const MinutesIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="3" />
    <path
      d="M32 20v12l8 5"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BooksIllustration = ({ className }: IllustrationProps) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    <path
      d="M16 15h10v34H16a4 4 0 01-4-4V19a4 4 0 014-4z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M26 15h12v34H26M38 15h10a4 4 0 014 4v26a4 4 0 01-4 4H38"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const welcomeScreens = [
  {
    icon: CozyBookIllustration,
    title: "AMUD",
    subtitle: "קוראים בקצב שלכם",
    description: "עוקבים אחרי הקריאה ביום־יום, בונים רצף יציב, ונהנים מזמן ספרים אמיתי.",
    emoji: "📚",
  },
  {
    icon: FriendlyChallengeIllustration,
    title: "יעדים עם נשמה",
    subtitle: "אתגרים קטנים, התמדה גדולה",
    description: "פותחים אתגר קריאה עם חברים, מתקדמים יחד, ורואים מי שומר על הקצב.",
    emoji: "🏆",
  },
  {
    icon: FriendsCircleIllustration,
    title: "קהילת קוראים",
    subtitle: "מעודדים אחד את השני",
    description: "רואים פעילות של חברים, משתפים הישגים, ובונים הרגל קריאה חברתי.",
    emoji: "🧡",
  },
];

const ONBOARDING_STATUS_EVENT = "onboarding-status-changed";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0-2: welcome, 3: signup, 4: goal
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goalType, setGoalType] = useState<"minutes" | "books">("minutes");
  const [goalValue, setGoalValue] = useState("30");

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    // Persist display name + reading goal to Supabase so the whole app
    // can read them — localStorage alone wasn't enough.
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const goalMinutes =
          goalType === "minutes"
            ? Number.parseInt(goalValue, 10)
            : 20; // default when goal is books/month

        await Promise.all([
          // Update auth metadata so user.user_metadata.full_name is set
          supabase.auth.updateUser({ data: { full_name: name.trim() || undefined } }),
          // Upsert profile row so display_name is queryable by friends
          supabase.from("profiles").upsert(
            {
              user_id: user.id,
              display_name: name.trim() || null,
              reading_goal_minutes: goalMinutes,
            },
            { onConflict: "user_id" }
          ),
        ]);
      }
    } catch (e) {
      console.warn("Onboarding save failed:", e);
      // Non-blocking — proceed even if the save fails
    }

    localStorage.setItem("onboarding_complete", "true");
    window.dispatchEvent(new Event(ONBOARDING_STATUS_EVENT));
    navigate("/", { replace: true });
  };

  const handleSkip = () => {
    setStep(3);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-center gap-2 pt-8 pb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-6">
        <AnimatePresence mode="wait">
          {step < 3 && (
            <motion.div
              key={`welcome-${step}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center text-center gap-6"
            >
              <div className="w-24 h-24 rounded-full reading-gradient flex items-center justify-center">
                {(() => {
                  const Illustration = welcomeScreens[step].icon;
                  return <Illustration className="w-12 h-12 text-primary-foreground" />;
                })()}
              </div>

              <div className="space-y-3">
                <p className="text-2xl" aria-hidden="true">
                  {welcomeScreens[step].emoji}
                </p>
                <h1 className="text-3xl font-bold text-foreground font-hebrew-serif">
                  {welcomeScreens[step].title}
                </h1>
                <p className="text-xl text-primary font-semibold">{welcomeScreens[step].subtitle}</p>
                <p className="text-muted-foreground text-lg max-w-xs mx-auto leading-relaxed">
                  {welcomeScreens[step].description}
                </p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center gap-6 max-w-sm mx-auto w-full"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground font-hebrew-serif">נעים להכיר ☕</h1>
                <p className="text-muted-foreground">שני פרטים קטנים ומתחילים לקרוא יחד</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">שם</Label>
                  <Input
                    id="name"
                    placeholder="השם שלכם"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    className="text-left"
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <Button variant="outline" className="w-full h-12 gap-3 text-base" onClick={handleNext}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    המשך עם Google
                  </Button>
                  <Button variant="outline" className="w-full h-12 gap-3 text-base" onClick={handleNext}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.3-3.74 4.25z" />
                    </svg>
                    המשך עם Apple
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center gap-6 max-w-sm mx-auto w-full"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground font-hebrew-serif">מה היעד שלכם? 🌿</h1>
                <p className="text-muted-foreground">בחרו יעד קריאה יומי פשוט וברור</p>
              </div>

              <RadioGroup
                value={goalType}
                onValueChange={(v) => {
                  setGoalType(v as "minutes" | "books");
                  setGoalValue(v === "minutes" ? "30" : "2");
                }}
                className="space-y-3"
              >
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    goalType === "minutes" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="minutes" />
                  <MinutesIllustration className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">דקות ביום</p>
                    <p className="text-sm text-muted-foreground">כמה דקות קריאה ביום?</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    goalType === "books" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="books" />
                  <BooksIllustration className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">ספרים בחודש</p>
                    <p className="text-sm text-muted-foreground">כמה ספרים בחודש?</p>
                  </div>
                </label>
              </RadioGroup>

              <div className="space-y-3">
                <Label>{goalType === "minutes" ? "דקות קריאה ביום" : "ספרים בחודש"}</Label>
                <div className="flex items-center gap-4">
                  {(goalType === "minutes" ? ["15", "30", "45", "60"] : ["1", "2", "3", "4"]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setGoalValue(v)}
                      className={`flex-1 h-12 rounded-xl text-lg font-semibold transition-all ${
                        goalValue === v
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-accent"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-8 pt-4 flex gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
        )}
        <div className="flex-1" />
        {step < 3 && (
          <>
            {step < 2 && (
              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                דלג
              </Button>
            )}
            <Button onClick={handleNext} className="gap-2 px-8 h-12 text-base">
              הבא
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </>
        )}
        {step === 3 && (
          <Button onClick={handleNext} disabled={!name.trim()} className="gap-2 px-8 h-12 text-base">
            הבא
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        {step === 4 && (
          <Button onClick={handleFinish} className="gap-2 px-8 h-12 text-base reading-gradient border-0">
            יאללה, מתחילים! 🍵
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

