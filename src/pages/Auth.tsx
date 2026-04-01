import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const FEATURES = [
  { emoji: "📚", label: "ספרייה" },
  { emoji: "🏆", label: "דירוגים" },
  { emoji: "🔥", label: "רצפים" },
  { emoji: "👥", label: "חברים" },
];

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "שגיאה בכניסה עם Google");
      setGoogleLoading(false);
    }
  };

  const handleReferral = async (newUserId: string) => {
    const referrerId = localStorage.getItem("amud_referral");
    if (!referrerId || referrerId === newUserId) return;
    try {
      await supabase.from("friendships").upsert(
        { requester_id: newUserId, addressee_id: referrerId, status: "accepted" },
        { onConflict: "requester_id,addressee_id" }
      );
      localStorage.removeItem("amud_referral");
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.user) await handleReferral(data.user.id);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(v => !v);
    setShowEmailForm(false);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* ── Brand ───────────────────────────────────────────────── */}
        <div className="text-center mb-8 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="block w-[3px] h-10 rounded-full bg-primary" />
            <img
              src="/logo.png"
              alt="AMUD"
              className="h-24 w-24 object-contain"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <span className="block w-[3px] h-10 rounded-full bg-primary" />
          </div>
          <h1 className="font-display text-4xl tracking-[0.18em] text-primary">AMUD</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            קרא יותר. התחרה עם חברים. בנה הרגל שנשאר.
          </p>
          <div className="flex justify-center gap-2 flex-wrap pt-1">
            {FEATURES.map(f => (
              <Badge key={f.label} variant="outline" className="text-[11px] border-border/60 text-muted-foreground gap-1 px-2.5 py-0.5">
                {f.emoji} {f.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* ── Auth card ───────────────────────────────────────────── */}
        <Card className="shadow-lg border-border/60">
          <CardHeader className="pb-2 pt-6 px-6">
            <h2 className="text-center text-base font-semibold text-foreground">
              {isSignUp ? "יצירת חשבון חדש" : "ברוכים השבים"}
            </h2>
          </CardHeader>

          <CardContent className="px-6 space-y-4">
            {/* Google */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-3 font-semibold border-border hover:border-border/80 bg-white hover:bg-white/90 text-foreground touch-manipulation"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading
                ? <span className="h-4 w-4 rounded-full border-2 border-muted border-t-blue-500 animate-spin" />
                : <GoogleIcon />}
              {googleLoading ? "מעביר לגוגל..." : isSignUp ? "הרשמה עם Google" : "כניסה עם Google"}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground px-1">או</span>
              <Separator className="flex-1" />
            </div>

            {/* Email */}
            {!showEmailForm ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-border touch-manipulation"
                onClick={() => setShowEmailForm(true)}
              >
                {isSignUp ? "הרשמה עם אימייל וסיסמה" : "כניסה עם אימייל וסיסמה"}
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
                  <Label htmlFor="email" className="text-xs text-muted-foreground">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    dir="ltr"
                    className="text-left h-10"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs text-muted-foreground">סיסמה</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="לפחות 6 תווים"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    dir="ltr"
                    className="text-left h-10"
                    required
                    minLength={6}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full touch-manipulation"
                  disabled={loading}
                >
                  {loading ? "רגע..." : isSignUp ? "יצירת חשבון" : "כניסה"}
                </Button>
              </motion.form>
            )}
          </CardContent>

          <CardFooter className="px-6 pb-6 justify-center">
            <p className="text-xs text-muted-foreground text-center">
              {isSignUp ? "כבר יש לך חשבון?" : "עדיין אין חשבון?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                className="text-primary font-semibold hover:underline underline-offset-2 touch-manipulation"
              >
                {isSignUp ? "כניסה" : "הרשמה"}
              </button>
            </p>
          </CardFooter>
        </Card>

      </motion.div>
    </div>
  );
}
