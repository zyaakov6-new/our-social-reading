import { useEffect, useState } from "react";
import { Flame, BookOpen, Clock, Calendar, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { sessions } = useReadingSessions();
  const [stats, setStats] = useState({
    currentStreak: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    allTimeMinutes: 0,
  });

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "קורא";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.timestamp);
      return sessionDate >= weekAgo;
    });

    const monthSessions = sessions.filter(s => {
      const sessionDate = new Date(s.timestamp);
      return sessionDate >= monthAgo;
    });

    const weekMinutes = weekSessions.reduce((sum, s) => sum + s.minutesRead, 0);
    const monthMinutes = monthSessions.reduce((sum, s) => sum + s.minutesRead, 0);
    const allTimeMinutes = sessions.reduce((sum, s) => sum + s.minutesRead, 0);

    const sessionDates = sessions.map(s => s.timestamp.split(' ')[0]);
    const uniqueDates = [...new Set(sessionDates)].sort().reverse();

    let streak = 0;
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

  const heatmapDays = Array.from({ length: 35 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (34 - i));
    const dateStr = date.toISOString().split('T')[0];

    const daySessions = sessions.filter(s => s.timestamp.startsWith(dateStr));
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.minutesRead, 0);

    let intensity = 0;
    if (totalMinutes > 0) {
      if (totalMinutes >= 60) intensity = 4;
      else if (totalMinutes >= 45) intensity = 3;
      else if (totalMinutes >= 30) intensity = 2;
      else intensity = 1;
    }

    return { date, intensity };
  });

  const intensityColors = [
    'bg-muted',
    'bg-primary/20',
    'bg-primary/40',
    'bg-primary/60',
    'bg-primary/80',
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/settings')}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
        >
          <Settings size={18} className="text-muted-foreground" />
        </button>
        <h1 className="font-serif text-2xl font-bold">הפרופיל שלי</h1>
      </div>

      <div className="px-4 max-w-md mx-auto space-y-4">
        <div className="text-center mb-2">
          <div className="mx-auto h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-2">
            <span className="font-serif text-2xl font-bold text-accent-foreground">{initial}</span>
          </div>
          <h2 className="font-serif text-xl font-bold">{displayName}</h2>
        </div>

        <div className="rounded-xl streak-gradient p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame size={22} className="text-secondary-foreground" />
            <span className="text-2xl font-bold text-secondary-foreground">{stats.currentStreak}</span>
          </div>
          <p className="text-sm text-secondary-foreground/90">ימים ברציפות</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card p-4 card-shadow text-center">
            <Clock size={20} className="text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.weekMinutes}</p>
            <p className="text-xs text-muted-foreground">דקות השבוע</p>
          </div>
          <div className="rounded-xl bg-card p-4 card-shadow text-center">
            <Clock size={20} className="text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.monthMinutes}</p>
            <p className="text-xs text-muted-foreground">דקות החודש</p>
          </div>
          <div className="rounded-xl bg-card p-4 card-shadow text-center col-span-2">
            <Clock size={20} className="text-secondary mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.allTimeMinutes}</p>
            <p className="text-xs text-muted-foreground">סה״כ דקות קריאה</p>
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
                className={`aspect-square rounded-sm ${intensityColors[day.intensity]}`}
                title={`${day.date.toLocaleDateString('he-IL')}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-card p-4 card-shadow">
          <h3 className="font-serif font-bold text-sm mb-3">פעילות אחרונה</h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">עדיין אין פעילות</p>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map(session => (
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

        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut size={16} />
          התנתקות
        </Button>
      </div>
    </div>
  );
};

export default Profile;
