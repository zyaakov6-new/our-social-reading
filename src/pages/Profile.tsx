import { useEffect, useState, useRef } from "react";
import { Flame, Clock, TrendingUp, BookOpen, Calendar, Settings, Pencil, Camera, Share2, Sparkles, Crown, Lock, BarChart2 } from "lucide-react";
import FriendsSection from "@/components/FriendsSection";
import SettingsSidebar from "@/components/SettingsSidebar";
import InviteModal from "@/components/InviteModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t, dir } = useLanguage();
  const { sessions, refetch } = useReadingSessions();
  const mySessions = sessions.filter(s => s.isMe);
  const [stats, setStats] = useState({
    currentStreak: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    allTimeMinutes: 0,
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { isPro, isLoading: subLoading, subscription, openCheckout } = useSubscription();
  const [editMinutes, setEditMinutes] = useState("");
  const [editPages, setEditPages] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "קורא";
  const initial = displayName.charAt(0).toUpperCase();
  const latestSession = mySessions[0];

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weekSessions = mySessions.filter(s => {
      const sessionDate = new Date(s.sessionDate);
      return sessionDate >= weekAgo;
    });

    const monthSessions = mySessions.filter(s => {
      const sessionDate = new Date(s.sessionDate);
      return sessionDate >= monthAgo;
    });

    const weekMinutes = weekSessions.reduce((sum, s) => sum + s.minutesRead, 0);
    const monthMinutes = monthSessions.reduce((sum, s) => sum + s.minutesRead, 0);
    const allTimeMinutes = mySessions.reduce((sum, s) => sum + s.minutesRead, 0);

    const toLocalDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const sessionDates = mySessions.map(s => s.sessionDate.substring(0, 10));
    const uniqueDates = [...new Set(sessionDates)].sort().reverse();

    let streak = 0;
    const today = toLocalDate(now);
    const yesterday = toLocalDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (uniqueDates.includes(expectedDate)) {
          streak++;
        } else {
          break;
        }
      }
    }

    setStats({
      currentStreak: streak,
      weekMinutes,
      monthMinutes,
      allTimeMinutes,
    });
  }, [sessions, user?.id]);

  // Load avatar from profiles table
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user?.id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').upsert({ user_id: user.id, avatar_url: publicUrl }, { onConflict: 'user_id' });
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      const { toast } = await import('sonner');
      toast.error(err?.message || 'שגיאה בהעלאת תמונה');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openEditLastSession = () => {
    if (!latestSession) return;
    setEditMinutes(latestSession.minutesRead.toString());
    setEditPages(latestSession.pagesRead.toString());
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!latestSession) return;

    const minutes = parseInt(editMinutes || "0", 10);
    const pages = parseInt(editPages || "0", 10);

    if (Number.isNaN(minutes) || Number.isNaN(pages)) {
      return;
    }

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("reading_sessions")
        .update({
          minutes_read: minutes,
          pages_read: pages,
        })
        .eq("id", latestSession.id);

      if (error) throw error;

      await refetch();
      setEditOpen(false);
    } catch (e) {
      console.error("Error updating reading session", e);
    } finally {
      setSavingEdit(false);
    }
  };

  const heatmapDays = Array.from({ length: 35 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (34 - i));
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const daySessions = mySessions.filter(s => s.sessionDate.substring(0, 10) === dateStr);
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.minutesRead, 0);

    let intensity = 0;
    if (daySessions.length > 0) {
      // Treat any activity (minutes or pages) as at least the lightest intensity,
      // and scale up with actual minutes when available.
      if (totalMinutes >= 60) intensity = 4;
      else if (totalMinutes >= 45) intensity = 3;
      else if (totalMinutes >= 30) intensity = 2;
      else if (totalMinutes > 0 || daySessions.some(s => s.pagesRead > 0)) intensity = 1;
    }
    if (intensity === 0 && daySessions.length > 0) {
      intensity = 1;
    }

    return { date, intensity };
  });

  const intensityColors = [
    'bg-muted',
    'bg-primary/15',
    'bg-primary/35',
    'bg-primary/58',
    'bg-primary/85',
  ];

  return (
    <div className="min-h-screen pb-28">
      <div
        className="sticky top-0 z-30 backdrop-blur-md pr-5 pl-16 pt-3 pb-2.5"
        style={{
          background: 'linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)',
          borderBottom: '2px solid hsl(126 15% 28% / 0.20)',
        }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span style={{ display: 'block', width: '3px', height: '30px', background: 'hsl(126 15% 28%)', borderRadius: '2px', flexShrink: 0 }} />
            <div className="min-w-0">
              <h1 className="font-display text-[1.75rem] tracking-[0.14em] leading-none truncate">{displayName}</h1>
              <p className="font-quote text-[10px] text-muted-foreground mt-0.5">{t.profile.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInviteOpen(true)}
              className="h-9 w-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "hsl(28 71% 57% / 0.12)", color: "hsl(28 71% 45%)" }}
              title="הזמן חברים"
            >
              <Share2 size={17} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="h-9 w-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Settings size={18} strokeWidth={1.5} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-md mx-auto space-y-4">
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative h-20 w-20 rounded-full p-[3px] group"
            style={{ background: 'linear-gradient(135deg, hsl(126 15% 28%) 0%, hsl(28 71% 57%) 100%)' }}
            title="שנה תמונת פרופיל"
          >
            <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="font-serif text-3xl font-bold text-foreground">{initial}</span>
              )}
            </div>
            {/* Camera overlay on hover */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Camera size={20} className="text-white" />
              )}
            </div>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div
          className="rounded-xl streak-gradient p-5 text-center relative overflow-hidden"
          style={{ boxShadow: '0 4px 20px -4px hsl(28 71% 57% / 0.35)' }}
        >
          {/* Faint oversized flame in background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
            <Flame size={110} className="text-white" />
          </div>
          <div className="relative z-10">
            {stats.currentStreak === 0 ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Flame size={22} className="text-secondary-foreground" />
                  <span className="text-lg font-semibold text-secondary-foreground">{t.profile.noStreak}</span>
                </div>
                <p className="text-sm text-secondary-foreground/90">{t.profile.noStreakSub}</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Flame size={24} className="text-secondary-foreground" />
                  <span className="text-4xl font-extrabold text-secondary-foreground leading-none font-numbers">{stats.currentStreak}</span>
                </div>
                <p className="text-sm text-secondary-foreground/90">{t.profile.streakDays}</p>
              </>
            )}
          </div>
        </div>

        {/* ── Recent activity (free for all) ── */}
        <div className="rounded-xl bg-card p-4 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-sm">{t.profile.recentActivity}</h3>
            {latestSession && (
              <button
                type="button"
                onClick={openEditLastSession}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil size={12} />
                {t.profile.editSession}
              </button>
            )}
          </div>
          {mySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t.profile.noSessionsYet}
            </p>
          ) : (
            <div className="space-y-3">
              {mySessions.slice(0, 5).map(session => (
                <div key={session.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">
                    {formatTimeAgo(session.timestamp, t.common)}
                  </span>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-serif font-medium text-xs truncate max-w-[150px]">{session.bookTitle}</span>
                    <span className="text-xs text-primary font-semibold">{session.minutesRead} {t.profile.minutesShort}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Advanced stats + heatmap (Pro only) ── */}
        {isPro ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 card-shadow text-center stat-green">
                <Clock size={20} className="text-primary mx-auto mb-1" />
                {stats.weekMinutes === 0 ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">{t.profile.noWeek}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.profile.noWeekSub}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-extrabold text-primary font-numbers">{stats.weekMinutes}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.profile.weekMinutes}</p>
                  </>
                )}
              </div>
              <div className="rounded-xl p-4 card-shadow text-center stat-teal">
                <TrendingUp size={20} className="mx-auto mb-1" style={{ color: 'hsl(188 100% 27%)' }} />
                {stats.monthMinutes === 0 ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">{t.profile.noMonth}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.profile.noMonthSub}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-extrabold font-numbers" style={{ color: 'hsl(188 100% 27%)' }}>{stats.monthMinutes}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.profile.monthMinutes}</p>
                  </>
                )}
              </div>
              <div className="rounded-xl p-4 card-shadow text-center col-span-2 stat-orange">
                <BookOpen size={20} className="mx-auto mb-1" style={{ color: 'hsl(28 71% 57%)' }} />
                {stats.allTimeMinutes === 0 ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">{t.profile.noBooksRead}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.profile.noActivity}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-extrabold font-numbers" style={{ color: 'hsl(28 71% 57%)' }}>{stats.allTimeMinutes}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.profile.totalMinutes}</p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-card p-4 card-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-primary" />
                <h3 className="font-serif font-bold text-sm">{t.profile.activityMap}</h3>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {(t.profile.heatmapDays as readonly string[]).map((day, idx) => (
                  <div key={idx} className="text-center text-[10px] text-muted-foreground mb-1">{day}</div>
                ))}
                {heatmapDays.map((day, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded ${intensityColors[day.intensity]} transition-colors`}
                    title={`${day.date.toLocaleDateString('he-IL')}`}
                  />
                ))}
              </div>
            </div>
          </>
        ) : !subLoading ? (
          // Slim teaser for free users — unobtrusive, at the bottom
          <button
            onClick={() => setUpgradeOpen(true)}
            className="w-full flex items-center gap-2.5 rounded-xl px-4 py-3 text-right transition-colors hover:bg-muted/60"
            style={{
              background: "hsl(126 15% 28% / 0.05)",
              border: "1px dashed hsl(126 15% 28% / 0.22)",
            }}
          >
            <BarChart2 size={14} className="text-primary/50 flex-shrink-0" />
            <span className="text-xs text-muted-foreground flex-1">סטטיסטיקות מתקדמות ולוח קריאה</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "hsl(126 15% 28%)", color: "hsl(44 30% 93%)" }}
            >
              PRO
            </span>
            <Lock size={12} className="text-muted-foreground/60 flex-shrink-0" />
          </button>
        ) : null}

        {/* ── Subscription card ── */}
        {isPro ? (
          <div
            className="rounded-xl p-4 card-shadow flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, hsl(126 15% 22%) 0%, hsl(126 15% 30%) 100%)" }}
          >
            <div className="flex items-center gap-3">
              <Crown size={20} className="text-yellow-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm text-white">{t.subscription.proActive}</p>
                {subscription?.currentPeriodEnd && (
                  <p className="text-xs text-white/60 mt-0.5">
                    {subscription.cancelAtPeriodEnd
                      ? t.subscription.proCancels(new Date(subscription.currentPeriodEnd).toLocaleDateString(dir === "rtl" ? "he-IL" : "en-US"))
                      : t.subscription.proRenews(new Date(subscription.currentPeriodEnd).toLocaleDateString(dir === "rtl" ? "he-IL" : "en-US"))}
                  </p>
                )}
              </div>
            </div>
            <span
              className="text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: "hsl(44 70% 55%)", color: "hsl(126 15% 15%)" }}
            >
              PRO
            </span>
          </div>
        ) : (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="w-full rounded-xl p-4 card-shadow flex items-center justify-between group transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, hsl(126 15% 28%) 0%, hsl(126 22% 38%) 100%)" }}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-white/80 flex-shrink-0" />
              <div className="text-start">
                <p className="font-bold text-sm text-white">{t.subscription.proTitle}</p>
                <p className="text-xs text-white/60">{t.subscription.proSubtitle}</p>
              </div>
            </div>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
              style={{ background: "hsl(44 70% 55%)", color: "hsl(126 15% 15%)" }}
            >
              {t.subscription.upgradeCta}
            </span>
          </button>
        )}

        <FriendsSection />
      </div>

      <SettingsSidebar open={settingsOpen} onOpenChange={setSettingsOpen} />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-lg">
              {t.profile.editSessionTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {latestSession && (
              <p className="text-xs text-muted-foreground text-center">
                {latestSession.bookTitle} • {formatTimeAgo(latestSession.timestamp, t.common)}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-minutes" className="text-xs">
                  {t.profile.minutesRead}
                </Label>
                <Input
                  id="edit-minutes"
                  type="number"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="text-right"
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-pages" className="text-xs">
                  {t.profile.pagesOptional}
                </Label>
                <Input
                  id="edit-pages"
                  type="number"
                  value={editPages}
                  onChange={(e) => setEditPages(e.target.value)}
                  className="text-right"
                  min={0}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditOpen(false)}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={savingEdit}
                onClick={handleSaveEdit}
              >
                {savingEdit ? t.common.saving : t.profile.saveChange}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
