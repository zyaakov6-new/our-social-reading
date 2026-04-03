import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import LanguageToggle from "@/components/LanguageToggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/analytics";
import { sanitizeReturnTo } from "@/lib/auth-flow";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function Auth() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const modeParam = searchParams.get("mode") === "login" ? "login" : "signup";
  const nextPath = sanitizeReturnTo(searchParams.get("next")) ?? "/";
  const source = searchParams.get("source") ?? "direct";
  const variant = searchParams.get("variant") ?? "unknown";
  const action = searchParams.get("action");

  const [isSignUp, setIsSignUp] = useState(modeParam === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    setIsSignUp(modeParam === "signup");
  }, [modeParam]);

  useEffect(() => {
    trackEvent("auth_viewed", {
      mode: modeParam,
      source,
      variant,
      action: action ?? "none",
      next: nextPath,
    });
  }, [action, modeParam, nextPath, source, variant]);

  const features = [
    { emoji: "📚", label: t.auth.feature1 },
    { emoji: "🏆", label: t.auth.feature2 },
    { emoji: "🔥", label: t.auth.feature3 },
    { emoji: "👥", label: t.auth.feature4 },
  ];

  const title = useMemo(
    () => (isSignUp ? t.auth.signupTitle : t.auth.loginTitle),
    [isSignUp, t.auth.loginTitle, t.auth.signupTitle],
  );

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      trackEvent("auth_google_clicked", {
        mode: isSignUp ? "signup" : "login",
        source,
        variant,
        action: action ?? "none",
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Error signing in with Google"));
      setGoogleLoading(false);
    }
  };

  const handleReferral = async (newUserId: string) => {
    const referrerId = localStorage.getItem("amud_referral");
    if (!referrerId || referrerId === newUserId) return;

    try {
      await supabase.from("friendships").upsert(
        { requester_id: newUserId, addressee_id: referrerId, status: "accepted" },
        { onConflict: "requester_id,addressee_id" },
      );
      localStorage.removeItem("amud_referral");
    } catch {
      // Referral linking is best-effort and should not block auth.
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}`,
          },
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          await handleReferral(data.user.id);
        }

        trackEvent("auth_email_submitted", {
          mode: "signup",
          source,
          variant,
          action: action ?? "none",
        });

        if (data.session) {
          navigate(nextPath, { replace: true });
        } else {
          toast.success(t.auth.confirmEmail);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          throw error;
        }

        trackEvent("auth_email_submitted", {
          mode: "login",
          source,
          variant,
          action: action ?? "none",
        });

        navigate(nextPath, { replace: true });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t.common.error));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    const nextMode = isSignUp ? "login" : "signup";
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("mode", nextMode);
    setSearchParams(nextParams, { replace: true });
    setShowEmailForm(false);
  };

  return (
    <div dir={dir} className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-12">
      <div className={`absolute top-4 ${dir === "rtl" ? "left-4" : "right-4"}`}>
        <LanguageToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 space-y-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="block h-10 w-[3px] rounded-full bg-primary" />
            <img
              src="/logo.png"
              alt="AMUD"
              className="h-24 w-24 object-contain"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <span className="block h-10 w-[3px] rounded-full bg-primary" />
          </div>
          <h1 className="font-display text-4xl tracking-[0.18em] text-primary">AMUD</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.auth.tagline}</p>
          {action && (
            <Alert className="border-primary/20 bg-primary/5 text-left">
              <AlertTitle className="text-sm">{t.auth.continueTitle}</AlertTitle>
              <AlertDescription className="text-xs">
                {isSignUp ? t.auth.continueSignup(action) : t.auth.continueLogin(action)}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {features.map((feature) => (
              <Badge
                key={feature.label}
                variant="outline"
                className="gap-1 border-border/60 px-2.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {feature.emoji} {feature.label}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="px-6 pb-2 pt-6">
            <h2 className="text-center text-base font-semibold text-foreground">{title}</h2>
          </CardHeader>

          <CardContent className="space-y-4 px-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full touch-manipulation gap-3 border-border bg-white font-semibold text-foreground hover:border-border/80 hover:bg-white/90"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-blue-500" />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? t.auth.googleLoading : isSignUp ? t.auth.googleSignup : t.auth.googleLogin}
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="px-1 text-xs text-muted-foreground">{t.common.or}</span>
              <Separator className="flex-1" />
            </div>

            {!showEmailForm ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full touch-manipulation border border-border/50 font-medium text-muted-foreground hover:border-border hover:text-foreground"
                onClick={() => setShowEmailForm(true)}
              >
                {isSignUp ? t.auth.emailSignup : t.auth.emailLogin}
              </Button>
            ) : (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-muted-foreground">
                    {t.auth.emailPlaceholder}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    dir="ltr"
                    className="h-10 text-left"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs text-muted-foreground">
                    {t.auth.passwordPlaceholder}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t.auth.passwordHint}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    dir="ltr"
                    className="h-10 text-left"
                    required
                    minLength={6}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full touch-manipulation" disabled={loading}>
                  {loading ? t.auth.submitting : isSignUp ? t.auth.createAccount : t.auth.loginBtn}
                </Button>
              </motion.form>
            )}
          </CardContent>

          <CardFooter className="justify-center px-6 pb-6">
            <p className="text-center text-xs text-muted-foreground">
              {isSignUp ? t.auth.hasAccount : t.auth.noAccount}{" "}
              <button
                type="button"
                onClick={switchMode}
                className="touch-manipulation font-semibold text-primary underline-offset-2 hover:underline"
              >
                {isSignUp ? t.auth.switchToLogin : t.auth.switchToSignup}
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
