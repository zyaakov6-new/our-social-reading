import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Clock, BookOpen, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isPublic: boolean;
}

interface Session {
  id: string;
  bookTitle: string;
  minutesRead: number;
  pagesRead: number;
  sessionDate: string;
  createdAt: string;
}

type FriendStatus = "none" | "pending" | "friends";

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [stats, setStats] = useState({ streak: 0, weekMinutes: 0, totalMinutes: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchAll();
  }, [userId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProfile(), fetchSessions(), fetchFriendStatus()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, is_public")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      setProfile({
        userId: (data as any).user_id,
        displayName: (data as any).display_name || "קורא",
        avatarUrl: (data as any).avatar_url,
        isPublic: (data as any).is_public !== false,
      });
    }
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("reading_sessions")
      .select("id, minutes_read, pages_read, session_date, created_at, books(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!data) return;

    const mapped: Session[] = (data as any[]).map(s => ({
      id: s.id,
      bookTitle: s.books?.title || "ספר לא ידוע",
      minutesRead: s.minutes_read,
      pagesRead: s.pages_read,
      sessionDate: s.session_date || s.created_at,
      createdAt: s.created_at,
    }));

    setSessions(mapped);

    // Compute stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekMins = mapped
      .filter(s => new Date(s.createdAt) >= weekAgo)
      .reduce((sum, s) => sum + s.minutesRead, 0);
    const totalMins = mapped.reduce((sum, s) => sum + s.minutesRead, 0);

    // Streak
    const dates = [...new Set(mapped.map(s => s.sessionDate.substring(0, 10)))].sort().reverse();
    let streak = 0;
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(now.getTime() - i * 86400000)
        .toISOString().split("T")[0];
      if (dates.includes(expected)) streak++;
      else break;
    }

    setStats({ streak, weekMinutes: weekMins, totalMinutes: totalMins });
  };

  const fetchFriendStatus = async () => {
    if (!me || !userId) return;
    const { data } = await supabase
      .from("friendships")
      .select("status, requester_id")
      .or(`and(requester_id.eq.${me.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${me.id})`)
      .maybeSingle();

    if (!data) { setFriendStatus("none"); return; }
    if ((data as any).status === "accepted") setFriendStatus("friends");
    else setFriendStatus("pending");
  };

  const handleAddFriend = async () => {
    if (!me || !userId) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from("friendships").insert({
        requester_id: me.id,
        addressee_id: userId,
        status: "pending",
      });
      if (error) throw error;
      setFriendStatus("pending");
      toast.success("בקשת חברות נשלחה");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full reading-gradient animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">פרופיל לא נמצא</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">חזור</button>
      </div>
    );
  }

  const isMe = me?.id === userId;
  const initial = profile.displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen pb-28 bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border/40">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowRight size={20} strokeWidth={1.5} />
        </button>
        <h1 className="font-semibold text-base">{profile.displayName}</h1>
      </div>

      <div className="px-4 pt-6 max-w-md mx-auto space-y-5">
        {/* Avatar + name + add friend */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="font-display text-2xl text-accent-foreground">{initial}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg leading-tight">{profile.displayName}</h2>
            {stats.streak > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Flame size={12} className="text-streak" />
                {stats.streak} ימים ברצף
              </p>
            )}
          </div>
          {!isMe && (
            <button
              onClick={friendStatus === "none" ? handleAddFriend : undefined}
              disabled={actionLoading || friendStatus !== "none"}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                friendStatus === "friends"
                  ? "bg-primary/10 text-primary cursor-default"
                  : friendStatus === "pending"
                  ? "bg-muted text-muted-foreground cursor-default"
                  : "btn-cta rounded-xl"
              }`}
            >
              {friendStatus === "friends" ? (
                <><UserCheck size={15} strokeWidth={1.5} /> חברים</>
              ) : friendStatus === "pending" ? (
                <><UserPlus size={15} strokeWidth={1.5} /> ממתין</>
              ) : (
                <><UserPlus size={15} strokeWidth={1.5} /> הוסף חבר</>
              )}
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame,    label: "רצף",      value: stats.streak > 0 ? `${stats.streak}d` : "—" },
            { icon: Clock,    label: "השבוע",     value: stats.weekMinutes > 0 ? `${stats.weekMinutes}m` : "—" },
            { icon: BookOpen, label: "סה״כ דקות", value: stats.totalMinutes > 0 ? `${stats.totalMinutes}m` : "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-card border border-border/50 p-3 text-center">
              <Icon size={16} strokeWidth={1.5} className="text-primary mx-auto mb-1" />
              <p className="text-base font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent sessions */}
        <div className="space-y-2">
          <h3 className="section-heading">פעילות אחרונה</h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">אין פעילות להציג</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-card border border-border/50 px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-medium truncate max-w-[180px]">{s.bookTitle}</p>
                    <p className="text-xs text-primary font-semibold">
                      {s.minutesRead} דק׳{s.pagesRead > 0 ? ` · ${s.pagesRead} עמ׳` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
