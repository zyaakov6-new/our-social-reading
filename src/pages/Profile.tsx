import { userStats, mockRecentSessions } from "@/lib/mockData";
import { Flame, BookOpen, Clock, Calendar, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "קורא";
  const initial = displayName.charAt(0).toUpperCase();

  // Generate heatmap data for last 30 days
  const today = new Date();
  const heatmapDays = Array.from({ length: 35 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (34 - i));
    // Random intensity for demo
    const intensity = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
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
      {/* Header */}
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
        {/* Avatar & Name */}
        <div className="text-center mb-2">
          <div className="mx-auto h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-2">
            <span className="font-serif text-2xl font-bold text-accent-foreground">{initial}</span>
          </div>
          <h2 className="font-serif text-xl font-bold">{displayName}</h2>
        </div>

        {/* Streak Banner */}
        <div className="rounded-xl streak-gradient p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame size={22} className="text-secondary-foreground" />
            <span className="text-2xl font-bold text-secondary-foreground">{userStats.currentStreak}</span>
          </div>
          <p className="text-sm text-secondary-foreground/90">ימים ברציפות 🔥</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card p-4 card-shadow text-center">
            <Clock size={20} className="text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{userStats.weekMinutes}</p>
            <p className="text-xs text-muted-foreground">דקות השבוע</p>
          </div>
          <div className="rounded-xl bg-card p-4 card-shadow text-center">
            <Clock size={20} className="text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{userStats.monthMinutes}</p>
            <p className="text-xs text-muted-foreground">דקות החודש</p>
          </div>
          <div className="rounded-xl bg-card p-4 card-shadow text-center">
            <BookOpen size={20} className="text-secondary mx-auto mb-1" />
            <p className="text-2xl font-bold">{userStats.monthBooks}</p>
            <p className="text-xs text-muted-foreground">ספרים החודש</p>
          </div>
          <div className="rounded-xl bg-card p-4 card-shadow text-center">
            <BookOpen size={20} className="text-secondary mx-auto mb-1" />
            <p className="text-2xl font-bold">{userStats.allTimeBooks}</p>
            <p className="text-xs text-muted-foreground">סה״כ ספרים</p>
          </div>
        </div>

        {/* Reading Calendar Heatmap */}
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

        {/* Recent Sessions */}
        <div className="rounded-xl bg-card p-4 card-shadow">
          <h3 className="font-serif font-bold text-sm mb-3">פעילות אחרונה</h3>
          <div className="space-y-3">
            {mockRecentSessions.slice(0, 5).map(session => (
              <div key={session.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">
                  {new Date(session.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                </span>
                <div className="flex items-center gap-3 text-right">
                  <span className="font-serif font-medium text-xs">{session.bookTitle}</span>
                  <span className="text-xs text-primary font-semibold">{session.minutesRead} דק׳</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
