import { useState, useEffect } from "react";
import { ChevronLeft, User, Target, Shield, Info, LogOut, ArrowRight, X } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

type Page = "main" | "account" | "goals" | "privacy" | "about";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Subpage: Account ──────────────────────────────────────────────────────────
const AccountPage = ({ onBack, onClose }: { onBack: () => void; onClose: () => void }) => {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Load display name from profiles table (canonical source)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setDisplayName(
          data?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || ""
        );
      });
  }, [user]);

  const saveDisplayName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
      if (error) throw error;
      await supabase.from("profiles").upsert({ user_id: user!.id, display_name: displayName }, { onConflict: "user_id" });
      toast.success(t.settings.saved);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error(t.settings.tooShortPassword); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      toast.success(t.settings.passwordChanged);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <SubpageHeader title={t.settings.account} onBack={onBack} onClose={onClose} />

      <div className="space-y-3">
        <h3 className="section-heading">{t.settings.displayName}</h3>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t.settings.nameLabel}</Label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="text-right" />
        </div>
        <Button onClick={saveDisplayName} disabled={saving} className="w-full btn-cta rounded-lg">
          {saving ? t.common.saving : t.settings.saveName}
        </Button>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-3">
        <h3 className="section-heading">{t.settings.changePassword}</h3>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t.settings.passwordLabel}</Label>
          <Input
            type="password"
            placeholder={t.settings.passwordPlaceholder}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            dir="ltr"
            className="text-left"
          />
        </div>
        <Button onClick={changePassword} disabled={saving || !newPassword} variant="outline" className="w-full rounded-lg">
          {saving ? t.settings.changing : t.settings.changePasswordBtn}
        </Button>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-1">
        <h3 className="section-heading">{t.settings.accountDetails}</h3>
        <p className="text-xs text-muted-foreground py-2">{user?.email}</p>
      </div>
    </div>
  );
};

// ── Subpage: Reading Goals ────────────────────────────────────────────────────
const GoalsPage = ({ onBack, onClose }: { onBack: () => void; onClose: () => void }) => {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const [dailyGoal, setDailyGoal] = useState("20");
  const [saving, setSaving] = useState(false);

  // Load saved goal from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("reading_goal_minutes")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.reading_goal_minutes) {
          setDailyGoal(String(data.reading_goal_minutes));
        }
      });
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const minutes = parseInt(dailyGoal, 10);
      if (isNaN(minutes) || minutes < 1) { toast.error(t.settings.invalidNumber); return; }
      await supabase
        .from("profiles")
        .upsert({ user_id: user!.id, reading_goal_minutes: minutes }, { onConflict: "user_id" });
      toast.success(t.settings.goalSaved);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const presets = [10, 20, 30, 45, 60];

  return (
    <div className="space-y-6" dir={dir}>
      <SubpageHeader title={t.settings.goals} onBack={onBack} onClose={onClose} />

      <div className="space-y-4">
        <h3 className="section-heading">{t.settings.dailyGoal}</h3>
        <p className="text-sm text-muted-foreground">{t.settings.dailyGoalQuestion}</p>

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
              {p} {t.leaderboard.minutesShort}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t.settings.orEnterManually}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={dailyGoal}
              onChange={e => setDailyGoal(e.target.value)}
              className="text-right w-24"
              min={1}
              max={300}
            />
            <span className="text-sm text-muted-foreground">{t.settings.minutesPerDay}</span>
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full btn-cta rounded-lg">
          {saving ? t.common.saving : t.settings.saveGoal}
        </Button>
      </div>
    </div>
  );
};

// ── Subpage: Privacy ──────────────────────────────────────────────────────────
const PrivacyPage = ({ onBack, onClose }: { onBack: () => void; onClose: () => void }) => {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load saved privacy setting from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_public")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data && typeof data.is_public === "boolean") {
          setIsPublic(data.is_public);
        }
      });
  }, [user]);

  const save = async (val: boolean) => {
    setIsPublic(val);
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .upsert({ user_id: user!.id, is_public: val }, { onConflict: "user_id" });
      toast.success(val ? t.settings.publicSet : t.settings.privateSet);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      <SubpageHeader title={t.settings.privacy} onBack={onBack} onClose={onClose} />

      <div className="space-y-4">
        <h3 className="section-heading">{t.settings.profileVisibility}</h3>
        <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{t.settings.publicProfile}</p>
            <p className="text-xs text-muted-foreground">
              {isPublic ? t.settings.publicDesc : t.settings.privateDesc}
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={save} disabled={saving} />
        </div>

        <div className="p-4 bg-muted/40 rounded-xl text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground/80">{t.settings.alwaysPrivate}</p>
          <p>• {t.settings.emailPrivate}</p>
          <p>• {t.settings.loginPrivate}</p>
          <p>• {t.settings.messagesPrivate}</p>
        </div>
      </div>
    </div>
  );
};

// ── Subpage: About ────────────────────────────────────────────────────────────
const AboutPage = ({ onBack, onClose }: { onBack: () => void; onClose: () => void }) => {
  const { t, dir } = useLanguage();
  const links = [
    { label: t.settings.reportBug, href: "mailto:support@amud.app" },
    { label: t.settings.sendFeedback, href: "mailto:feedback@amud.app" },
    { label: t.settings.privacyPolicy, href: "#" },
    { label: t.settings.terms, href: "#" },
  ];
  return (
    <div className="space-y-6" dir={dir}>
      <SubpageHeader title={t.settings.about} onBack={onBack} onClose={onClose} />

      <div className="flex flex-col items-center py-4 gap-2">
        <div className="w-16 h-16">
          <img src="/logo.png" alt="AMUD" className="w-full h-full object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <h2 className="font-display text-2xl tracking-widest">AMUD</h2>
        <p className="font-quote text-xs text-muted-foreground italic">עמוד · גרסה 1.0</p>
      </div>

      <div className="space-y-2">
        <h3 className="section-heading">{t.settings.aboutAmud}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{t.settings.aboutDesc}</p>
      </div>

      <div className="space-y-2">
        {links.map(link => (
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
};

// ── Shared subpage header ─────────────────────────────────────────────────────
// Back button on the right (RTL start), X close on the left (RTL end) — never stacked
const SubpageHeader = ({ title, onBack, onClose }: { title: string; onBack: () => void; onClose: () => void }) => (
  <div className="flex items-center justify-between pb-2">
    <button
      onClick={onClose}
      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
    >
      <X size={18} strokeWidth={1.5} />
    </button>
    <h2 className="font-semibold text-base">{title}</h2>
    <button
      onClick={onBack}
      className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
    >
      <ArrowRight size={18} strokeWidth={1.5} className="text-foreground" />
    </button>
  </div>
);

// ── Root component ────────────────────────────────────────────────────────────
const SettingsSidebar = ({ open, onOpenChange }: Props) => {
  const [page, setPage] = useState<Page>("main");
  const { signOut } = useAuth();
  const { t, dir } = useLanguage();

  const menuItems = [
    { page: "account" as Page, icon: User,   label: t.settings.account,  desc: t.settings.accountDesc },
    { page: "goals"   as Page, icon: Target, label: t.settings.goals,    desc: t.settings.goalsDesc },
    { page: "privacy" as Page, icon: Shield, label: t.settings.privacy,  desc: t.settings.privacyDesc },
    { page: "about"   as Page, icon: Info,   label: t.settings.about,    desc: t.settings.aboutMenuDesc },
  ];

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setPage("main"), 300);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full max-w-sm p-0 bg-background" dir={dir}>
        <div className="flex flex-col h-full">
          {/* Header: title on right (RTL start), X close on left (RTL end) */}
          {page === "main" && (
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <SheetClose asChild>
                <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </SheetClose>
              <h2 className="font-semibold text-base">{t.settings.title}</h2>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {page === "main" && (
              <div className="space-y-2" dir={dir}>
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

            {page === "account" && <AccountPage onBack={() => setPage("main")} onClose={handleClose} />}
            {page === "goals"   && <GoalsPage   onBack={() => setPage("main")} onClose={handleClose} />}
            {page === "privacy" && <PrivacyPage onBack={() => setPage("main")} onClose={handleClose} />}
            {page === "about"   && <AboutPage   onBack={() => setPage("main")} onClose={handleClose} />}
          </div>

          {page === "main" && (
            <div className="px-5 py-4 border-t border-border/50">
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/8 transition-colors"
              >
                <LogOut size={16} strokeWidth={1.5} />
                {t.settings.signOut}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSidebar;
