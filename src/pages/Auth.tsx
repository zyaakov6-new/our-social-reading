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
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
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
    <div dir="rtl" className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo area */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full reading-gradient flex items-center justify-center">
            <svg viewBox="0 0 64 64" className="w-9 h-9 text-primary-foreground" fill="none" aria-hidden="true">
              <path d="M14 16.5c0-2.5 2-4.5 4.5-4.5H32v36H18.5a4.5 4.5 0 01-4.5-4.5v-27z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M50 16.5c0-2.5-2-4.5-4.5-4.5H32v36h13.5a4.5 4.5 0 004.5-4.5v-27z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 23h6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M36 23h6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground font-hebrew-serif">ספר ביחד</h1>
          <p className="text-muted-foreground">
            {isSignUp ? "הצטרפו לקהילת הקוראים" : "שמחים לראות אתכם שוב ☕"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">שם</Label>
              <Input
                id="name"
                placeholder="השם שלכם"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-right"
                required
              />
            </div>
          )}
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
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              className="text-left"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full h-12 text-base reading-gradient border-0" disabled={loading}>
            {loading ? "רגע..." : isSignUp ? "הרשמה" : "כניסה"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "כבר יש לכם חשבון?" : "עדיין אין חשבון?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-semibold hover:underline"
          >
            {isSignUp ? "כניסה" : "הרשמה"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
