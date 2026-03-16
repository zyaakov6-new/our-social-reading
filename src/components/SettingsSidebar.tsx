import { useState } from "react";
import { ChevronLeft, User, Target, Shield, Info, LogOut, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Page = "main" | "account" | "goals" | "privacy" | "about";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Subpage: Account ──────────────────────────────────────────────────────────
const AccountPage = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
  );
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const saveDisplayName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
      if (error) throw error;
      await supabase.from("profiles").upsert({ user_id: user!.id, display_name: displayName }, { onConflict: "user_id" });
      toast.success("השם עודכן");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error("הסיסמה חייבת להכיל לפחות 6 תווים"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      toast.success("הסיסמה שונתה");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <SubpageHeader title="חשבון" onBack={onBack} />

      <div className="space-y-3">
        <h3 className="section-heading">שם תצוגה</h3>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">שם</Label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="text-right" />
        </div>
        <Button onClick={saveDisplayName} disabled={saving} className="w-full btn-cta rounded-lg">
          {saving ? "שומר..." : "שמור שם"}
        </Button>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-3">
        <h3 className="section-heading">שינוי סיסמה</h3>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">סיסמה חדשה</Label>
          <Input
            type="password"
            placeholder="לפחות 6 תווים"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            dir="ltr"
            className="text-left"
          />
        </div>
        <Button onClick={changePassword} disabled={saving || !newPassword} variant="outline" className="w-full rounded-lg">
          {saving ? "משנה..." : "שנה סיסמה"}
        </Button>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-1">
        <h3 className="section-heading">פרטי חשבון</h3>
        <p className="text-xs text-muted-foreground py-2">{user?.email}</p>
      </div>
    </div>
  );
};

// ── Subpage: Reading Goals ────────────────────────────────────────────────────
const GoalsPage = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [dailyGoal, setDailyGoal] = useState("20");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const minutes = parseInt(dailyGoal, 10);
      if (isNaN(minutes) || minutes < 1) { toast.error("הזן מספר תקין"); return; }
      await supabase
        .from("profiles")
        .upsert({ user_id: user!.id, reading_goal_minutes: minutes }, { onConflict: "user_id" });
      toast.success("היעד נשמר");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const presets = [10, 20, 30, 45, 60];

  return (
    <div className="space-y-6" dir="rtl">
      <SubpageHeader title="יעדי קריאה" onBack={onBack} />

      <div className="space-y-4">
        <h3 className="section-heading">יעד יומי</h3>
        <p className="text-sm text-muted-foreground">כמה דקות תרצה לקרוא בכל יום?</p>

        <div className="flex gap-2 flex-wrap">
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setDailyGoal(p.toString())}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                dailyGoal === p.toString()
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:border-primary/50"
              }`}
            >
              {p} דק׳
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">או הזן ידנית</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={dailyGoal}
              onChange={e => setDailyGoal(e.target.value)}
              className="text-right w-24"
              min={1}
              max={300}
            />
            <span className="text-sm text-muted-foreground">דקות ביום</span>
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full btn-cta rounded-lg">
          {saving ? "שומר..." : "שמור יעד"}
        </Button>
      </div>
    </div>
  );
};

// ── Subpage: Privacy ──────────────────────────────────────────────────────────
const PrivacyPage = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const save = async (val: boolean) => {
    setIsPublic(val);
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .upsert({ user_id: user!.id, is_public: val }, { onConflict: "user_id" });
      toast.success(val ? "הפרופיל עכשיו פומבי" : "הפרופיל עכשיו פרטי");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <SubpageHeader title="פרטיות" onBack={onBack} />

      <div className="space-y-4">
        <h3 className="section-heading">נראות פרופיל</h3>
        <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">פרופיל פומבי</p>
            <p className="text-xs text-muted-foreground">
              {isPublic ? "כולם יכולים לראות את הפעילות שלך" : "רק חברים יכולים לראות את הפעילות שלך"}
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={save} disabled={saving} />
        </div>

        <div className="p-4 bg-muted/40 rounded-xl text-xs text-muted-foreground space-y-1" dir="rtl">
          <p className="font-medium text-foreground/80">מה נשמר תמיד פרטי:</p>
          <p>• כתובת האימייל שלך</p>
          <p>• פרטי כניסה</p>
          <p>• הודעות פרטיות</p>
        </div>
      </div>
    </div>
  );
};

// ── Subpage: About ────────────────────────────────────────────────────────────
const AboutPage = ({ onBack }: { onBack: () => void }) => (
  <div className="space-y-6" dir="rtl">
    <SubpageHeader title="אודות" onBack={onBack} />

    <div className="flex flex-col items-center py-4 gap-2">
      <div className="w-16 h-16">
        <img src="/logo.png" alt="AMUD" className="w-full h-full object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      </div>
      <h2 className="font-display text-2xl tracking-widest">AMUD</h2>
      <p className="font-quote text-xs text-muted-foreground italic">עמוד · גרסה 1.0</p>
    </div>

    <div className="space-y-2">
      <h3 className="section-heading">AMUD היא</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        אפליקציית מעקב קריאה חברתית, בנויה עבור הקורא הישראלי. בנה הרגל קריאה יומי, התחרה עם חברים ועקוב אחרי ההתקדמות שלך — עמוד אחרי עמוד.
      </p>
    </div>

    <div className="space-y-2">
      {[
        { label: "דווח על באג", href: "mailto:support@amud.app" },
        { label: "שלח משוב", href: "mailto:feedback@amud.app" },
        { label: "מדיניות פרטיות", href: "#" },
        { label: "תנאי שימוש", href: "#" },
      ].map(link => (
        <a
          key={link.label}
          href={link.href}
          className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60 text-sm hover:border-primary/40 transition-colors"
        >
          <ChevronLeft size={16} className="text-muted-foreground" />
          <span>{link.label}</span>
        </a>
      ))}
    </div>
  </div>
);

// ── Shared subpage header ─────────────────────────────────────────────────────
const SubpageHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <div className="flex items-center gap-3 pb-2">
    <button onClick={onBack} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
      <ArrowRight size={18} strokeWidth={1.5} className="text-foreground" />
    </button>
    <h2 className="font-semibold text-base">{title}</h2>
  </div>
);

// ── Main settings menu ────────────────────────────────────────────────────────
const menuItems = [
  { page: "account" as Page, icon: User,   label: "חשבון",        desc: "שם, סיסמה, אימייל" },
  { page: "goals"   as Page, icon: Target, label: "יעדי קריאה",   desc: "יעד יומי ושבועי" },
  { page: "privacy" as Page, icon: Shield, label: "פרטיות",        desc: "נראות פרופיל" },
  { page: "about"   as Page, icon: Info,   label: "אודות",         desc: "גרסה, משוב, קישורים" },
];

// ── Root component ────────────────────────────────────────────────────────────
const SettingsSidebar = ({ open, onOpenChange }: Props) => {
  const [page, setPage] = useState<Page>("main");
  const { signOut } = useAuth();

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setPage("main"), 300);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full max-w-sm p-0 bg-background" dir="rtl">
        <div className="flex flex-col h-full">
          {/* Header — SheetContent already renders a close (X) button, no need for a second one */}
          <SheetHeader className="px-5 py-4 border-b border-border/50">
            <SheetTitle className="font-semibold text-base text-right">
              {page === "main" ? "הגדרות" : ""}
            </SheetTitle>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {page === "main" && (
              <div className="space-y-2" dir="rtl">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.page}
                      onClick={() => setPage(item.page)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/40 transition-colors text-right"
                    >
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon size={18} strokeWidth={1.5} className="text-foreground/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronLeft size={16} className="text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {page === "account" && <AccountPage onBack={() => setPage("main")} />}
            {page === "goals"   && <GoalsPage   onBack={() => setPage("main")} />}
            {page === "privacy" && <PrivacyPage onBack={() => setPage("main")} />}
            {page === "about"   && <AboutPage   onBack={() => setPage("main")} />}
          </div>

          {/* Footer — sign out only on main page */}
          {page === "main" && (
            <div className="px-5 py-4 border-t border-border/50">
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/8 transition-colors"
              >
                <LogOut size={16} strokeWidth={1.5} />
                התנתקות
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSidebar;
