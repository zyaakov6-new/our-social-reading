import { useEffect, useState } from "react";
import { Flame, Clock, TrendingUp, BookOpen, Calendar, Settings, Pencil } from "lucide-react";
import FriendsSection from "@/components/FriendsSection";
import SettingsSidebar from "@/components/SettingsSidebar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { supabase } from "@/integrations/supabase/client";
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
  const { sessions, refetch } = useReadingSessions();
  const mySessions = sessions.filter(s => s.isMe);
  const [stats, setStats] = useState({
    currentStreak: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    allTimeMinutes: 0,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  }, [sessions, user]);

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
        className="sticky top-0 z-30 backdrop-blur-md pr-5 pl-16 pt-5 pb-4"
        style={{
          background: 'linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)',
          borderBottom: '2px solid hsl(126 15% 28% / 0.20)',
        }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <span style={{ display: 'block', width: '3px', height: '44px', background: 'hsl(126 15% 28%)', borderRadius: '2px', flexShrink: 0 }} />
            <div>
              <h1 className="font-display text-[2.6rem] tracking-[0.14em] leading-none">{displayName}</h1>
              <p className="font-quote text-[11px] text-muted-foreground mt-1">הפרופיל שלי</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="h-9 w-9 rounded-full bg-muted/80 flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Settings size={18} strokeWidth={1.5} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-md mx-auto space-y-4">
        <div className="flex justify-center mb-3">
          <div
            className="h-20 w-20 rounded-full p-[3px]"
            style={{ background: 'linear-gradient(135deg, hsl(126 15% 28%) 0%, hsl(28 71% 57%) 100%)' }}
          >
            <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
              <span className="font-serif text-3xl font-bold text-foreground">{initial}</span>
            </div>
          </div>
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
                  <span className="text-lg font-semibold text-secondary-foreground">עדיין אין רצף</span>
                </div>
                <p className="text-sm text-secondary-foreground/90">התחל לקרוא היום כדי לבנות רצף ראשון 🔥</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Flame size={24} className="text-secondary-foreground" />
                  <span className="text-4xl font-extrabold text-secondary-foreground leading-none font-numbers">{stats.currentStreak}</span>
                </div>
                <p className="text-sm text-secondary-foreground/90">ימים ברציפות</p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 card-shadow text-center stat-green">
            <Clock size={20} className="text-primary mx-auto mb-1" />
            {stats.weekMinutes === 0 ? (
              <>
                <p className="text-sm font-semibold text-foreground">עוד לא קראת השבוע</p>
                <p className="text-xs text-muted-foreground mt-1">סשן קצר היום יספיק 🌱</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-extrabold text-primary font-numbers">{stats.weekMinutes}</p>
                <p className="text-xs text-muted-foreground mt-0.5">דקות השבוע</p>
              </>
            )}
          </div>
          <div className="rounded-xl p-4 card-shadow text-center stat-teal">
            <TrendingUp size={20} className="mx-auto mb-1" style={{ color: 'hsl(188 100% 27%)' }} />
            {stats.monthMinutes === 0 ? (
              <>
                <p className="text-sm font-semibold text-foreground">החודש עוד לפניך</p>
                <p className="text-xs text-muted-foreground mt-1">בחר ספר והתחל 📚</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-extrabold font-numbers" style={{ color: 'hsl(188 100% 27%)' }}>{stats.monthMinutes}</p>
                <p className="text-xs text-muted-foreground mt-0.5">דקות החודש</p>
              </>
            )}
          </div>
          <div className="rounded-xl p-4 card-shadow text-center col-span-2 stat-orange">
            <BookOpen size={20} className="mx-auto mb-1" style={{ color: 'hsl(28 71% 57%)' }} />
            {stats.allTimeMinutes === 0 ? (
              <>
                <p className="text-sm font-semibold text-foreground">הכול מחכה לקריאה הראשונה</p>
                <p className="text-xs text-muted-foreground mt-1">סשן אחד קטן ואתה על המפה 📚</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-extrabold font-numbers" style={{ color: 'hsl(28 71% 57%)' }}>{stats.allTimeMinutes}</p>
                <p className="text-xs text-muted-foreground mt-0.5">סה״כ דקות קריאה</p>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-card p-4 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-primary" />
            <h3 className="font-serif font-bold text-sm">לוח קריאה</h3>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
              <div key={day} className="text-center text-[10px] text-muted-foreground mb-1">{day}</div>
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

        <div className="rounded-xl bg-card p-4 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-sm">פעילות אחרונה</h3>
            {latestSession && (
              <button
                type="button"
                onClick={openEditLastSession}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil size={12} />
                עריכת סשן אחרון
              </button>
            )}
          </div>
          {mySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              כשתתחיל לקרוא, נראה כאן את סשני הקריאה האחרונים שלך
            </p>
          ) : (
            <div className="space-y-3">
              {mySessions.slice(0, 5).map(session => (
                <div key={session.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">
                    {session.timestamp}
                  </span>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-serif font-medium text-xs truncate max-w-[150px]">{session.bookTitle}</span>
                    <span className="text-xs text-primary font-semibold">{session.minutesRead} דק׳</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <FriendsSection />
      </div>

      <SettingsSidebar open={settingsOpen} onOpenChange={setSettingsOpen} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-lg">
              עריכת סשן אחרון
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {latestSession && (
              <p className="text-xs text-muted-foreground text-center">
                {latestSession.bookTitle} • {latestSession.timestamp}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-minutes" className="text-xs">
                  דקות קריאה
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
                  עמודים (אופציונלי)
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
                ביטול
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={savingEdit}
                onClick={handleSaveEdit}
              >
                {savingEdit ? "שומר..." : "שמור שינוי"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
