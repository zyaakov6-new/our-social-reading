import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Official Google "G" logo colours
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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
          queryParams: {
            // Ask Google to show the account picker every time
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
      // Browser will redirect — no need to setGoogleLoading(false)
    } catch (error: any) {
      toast.error(error.message || "שגיאה בכניסה עם Google");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("נרשמת בהצלחה! בדקו את האימייל לאישור");
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

  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col">
      {/* Thin top accent */}
      <div className="h-px bg-primary w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-xs space-y-8">

          {/* ── Brand mark ─────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-5">
              <span className="amud-pillar h-32" />
              <div className="flex flex-col items-center gap-2">
                <div className="w-36 h-36">
                  <img
                    src="/logo.png"
                    alt="AMUD"
                    className="w-full h-full object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <h1 className="font-display text-4xl tracking-[0.16em] text-foreground">AMUD</h1>
              </div>
              <span className="amud-pillar h-32" />
            </div>

            <div className="text-center space-y-2.5">
              <div className="flex items-center gap-3 justify-center">
                <span className="h-px flex-1 bg-border/70" />
                <p className="font-serif text-base font-semibold text-foreground tracking-wide">
                  ברוכים השבים ל-AMUD
                </p>
                <span className="h-px flex-1 bg-border/70" />
              </div>
              <p className="font-caption text-xs text-muted-foreground leading-relaxed">
                קרא יותר, התחרה יותר –<br />
                עם חברים, לוח תוצאות ומעקב אחרי הספרים שלך
              </p>
              <div className="flex justify-center gap-3 pt-0.5">
                {[['📚', 'ספרייה'], ['🏆', 'דירוגים'], ['👥', 'חברים']].map(([emoji, label]) => (
                  <span key={label} className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/70 px-2.5 py-1 rounded-full">
                    {emoji} {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Google button — primary CTA ─────────────────────── */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
              style={{
                background: "#fff",
                borderColor: "hsl(210 11% 86%)",
                color: "hsl(210 11% 20%)",
                boxShadow: "0 1px 4px hsl(210 11% 14% / 0.08)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(210 11% 70%)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px hsl(210 11% 14% / 0.14)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "hsl(210 11% 86%)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px hsl(210 11% 14% / 0.08)";
              }}
            >
              {googleLoading ? (
                <span className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span>{googleLoading ? "מעביר לגוגל…" : isSignUp ? "הרשמה עם Google" : "כניסה עם Google"}</span>
            </button>

            {/* ── Divider ─────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-caption px-1">או</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* ── Email toggle ─────────────────────────────────────── */}
            {!showEmailForm ? (
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full h-11 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                {isSignUp ? "הרשמה עם אימייל וסיסמה" : "כניסה עם אימייל וסיסמה"}
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="font-caption text-muted-foreground text-xs">שם תצוגה</Label>
                    <Input
                      id="name"
                      placeholder="השם שלכם"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="text-right h-11 bg-input border-border/60 rounded-lg"
                      required
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-caption text-muted-foreground text-xs">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    dir="ltr"
                    className="text-left h-11 bg-input border-border/60 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="font-caption text-muted-foreground text-xs">סיסמה</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    dir="ltr"
                    className="text-left h-11 bg-input border-border/60 rounded-lg"
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm btn-cta rounded-lg"
                  disabled={loading}
                >
                  {loading ? "רגע…" : isSignUp ? "הרשמה" : "כניסה"}
                </Button>
              </form>
            )}
          </div>

          {/* ── Switch sign-in / sign-up ─────────────────────────── */}
          <p className="text-center font-caption text-xs text-muted-foreground">
            {isSignUp ? "כבר יש לכם חשבון?" : "עדיין אין חשבון?"}{" "}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setShowEmailForm(false); }}
              className="text-primary font-semibold hover:underline underline-offset-2"
            >
              {isSignUp ? "כניסה" : "הרשמה"}
            </button>
          </p>
        </div>
      </div>

      {/* Thin bottom bar */}
      <div className="h-px bg-border w-full" />
    </div>
  );
};

export default Auth;
