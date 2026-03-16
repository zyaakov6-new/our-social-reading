import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

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
      {/* Thin top accent — The Pillar's crown */}
      <div className="h-px bg-primary w-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-xs space-y-12">

          {/* ── Brand mark ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-6">
            {/* Logo flanked by vertical pillar lines */}
            <div className="flex items-center gap-5">
              <span className="amud-pillar h-20" />
              <div className="flex flex-col items-center gap-2">
                {/* Logo image — placed by user as /public/logo.png */}
                <div className="w-16 h-16">
                  <img
                    src="/logo.png"
                    alt="AMUD"
                    className="w-full h-full object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <h1 className="font-display text-5xl tracking-[0.22em] text-foreground">AMUD</h1>
                <p className="font-quote text-sm text-muted-foreground" style={{ fontSize: '0.85rem' }}>
                  עמוד
                </p>
              </div>
              <span className="amud-pillar h-20" />
            </div>

            <p className="font-ui text-sm text-muted-foreground text-center">
              {isSignUp ? "הצטרפו לקהילת הקוראים" : "ברוכים השבים"}
            </p>
          </div>

          {/* ── Form ───────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-caption text-muted-foreground">שם</Label>
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
              <Label htmlFor="email" className="font-caption text-muted-foreground">אימייל</Label>
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
              <Label htmlFor="password" className="font-caption text-muted-foreground">סיסמה</Label>
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

            {/* Terra Cotta CTA — the one thing to do */}
            <Button
              type="submit"
              className="w-full h-12 text-base btn-cta rounded-lg mt-2"
              disabled={loading}
            >
              {loading ? "רגע..." : isSignUp ? "הרשמה" : "כניסה"}
            </Button>
          </form>

          {/* ── Switch mode ────────────────────────────────────────── */}
          <p className="text-center font-caption text-muted-foreground">
            {isSignUp ? "כבר יש לכם חשבון?" : "עדיין אין חשבון?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-semibold hover:underline underline-offset-2"
            >
              {isSignUp ? "כניסה" : "הרשמה"}
            </button>
          </p>
        </div>
      </div>

      {/* Thin bottom bar — closes the pillar frame */}
      <div className="h-px bg-border w-full" />
    </div>
  );
};

export default Auth;
