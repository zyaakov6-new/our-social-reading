import { useEffect, useState } from "react";
import { Trophy, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  weekMinutes: number;
  isMe: boolean;
}

const AVATAR_COLORS: Record<string, string> = {
  א: 'hsl(126 15% 28%)', ב: 'hsl(188 100% 27%)', ג: 'hsl(28 71% 57%)',
  ד: 'hsl(126 18% 38%)', ה: 'hsl(188 80% 32%)', ו: 'hsl(22 65% 50%)',
  ז: 'hsl(126 12% 45%)', ח: 'hsl(188 60% 35%)', ט: 'hsl(28 55% 48%)',
  י: 'hsl(126 20% 32%)', כ: 'hsl(188 90% 24%)', ל: 'hsl(28 65% 52%)',
  מ: 'hsl(126 15% 28%)', נ: 'hsl(188 100% 27%)', ס: 'hsl(28 71% 57%)',
  ע: 'hsl(126 18% 38%)', פ: 'hsl(188 80% 32%)', צ: 'hsl(22 65% 50%)',
  ק: 'hsl(126 12% 45%)', ר: 'hsl(188 60% 35%)', ש: 'hsl(28 55% 48%)',
  ת: 'hsl(126 20% 32%)',
};

const MEDALS = ["🥇", "🥈", "🥉"];

interface LeaderboardProps {
  onAddFriendsClick?: () => void;
}

const Leaderboard = ({ onAddFriendsClick }: LeaderboardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [hasFriends, setHasFriends] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        // Get all accepted friends
        const { data: friendships } = await supabase
          .from("friendships")
          .select("requester_id, addressee_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

        const friendIds = (friendships || []).map((f: any) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        );

        const allIds = [user.id, ...friendIds];
        setHasFriends(friendIds.length > 0);

        // Get profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", allIds);

        const profileMap: Record<string, string> = {};
        (profiles || []).forEach((p: any) => {
          profileMap[p.user_id] = p.display_name || "קורא";
        });

        // Get this week's reading sessions
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split("T")[0];

        const { data: sessions } = await supabase
          .from("reading_sessions")
          .select("user_id, minutes_read")
          .in("user_id", allIds)
          .gte("session_date", weekAgoStr);

        // Aggregate
        const minutesMap: Record<string, number> = {};
        allIds.forEach(id => { minutesMap[id] = 0; });
        (sessions || []).forEach((s: any) => {
          minutesMap[s.user_id] = (minutesMap[s.user_id] || 0) + (s.minutes_read || 0);
        });

        // For the current user, fall back to auth metadata if no profile row exists
        const myFallbackName =
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "קורא";

        const result: LeaderboardEntry[] = allIds.map(id => ({
          userId: id,
          displayName: profileMap[id] || (id === user.id ? myFallbackName : "קורא"),
          weekMinutes: minutesMap[id] || 0,
          isMe: id === user.id,
        }));

        result.sort((a, b) => b.weekMinutes - a.weekMinutes);
        setEntries(result);
      } catch (e) {
        console.error("Leaderboard error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="rounded-xl bg-card p-4 card-shadow space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} className="text-primary" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-3 w-12 rounded mr-auto" />
          </div>
        ))}
      </div>
    );
  }

  // No friends yet — show invite CTA
  if (!hasFriends) {
    return (
      <div className="rounded-xl bg-card card-shadow overflow-hidden" style={{ border: '1px solid hsl(44 15% 80%)' }}>
        <div className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid hsl(44 12% 76% / 0.6)' }}>
          <Trophy size={15} strokeWidth={1.5} style={{ color: 'hsl(28 71% 57%)' }} />
          <h3 className="font-bold text-sm">מובילי השבוע</h3>
        </div>
        <div className="px-4 py-5 text-center space-y-3">
          <p className="text-sm font-serif font-bold">טבלת מנצחים ריקה</p>
          <p className="text-xs text-muted-foreground">הוסף חברים כדי להתחרות ולראות מי קורא הכי הרבה</p>
          <button
            onClick={() => onAddFriendsClick ? onAddFriendsClick() : navigate("/friends")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            style={{ background: 'hsl(126 15% 28%)' }}
          >
            <UserPlus size={14} strokeWidth={1.5} />
            הוסף חברים
          </button>
        </div>
      </div>
    );
  }

  if (entries.every(e => e.weekMinutes === 0)) {
    return (
      <div className="rounded-xl bg-card p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} style={{ color: 'hsl(28 71% 57%)' }} />
          <h3 className="font-serif font-bold text-sm">מובילי השבוע</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-3">עוד אין פעילות השבוע — התחל לקרוא!</p>
      </div>
    );
  }

  const maxMinutes = Math.max(...entries.map(e => e.weekMinutes), 1);

  return (
    <div className="rounded-xl bg-card card-shadow overflow-hidden" style={{ border: '1px solid hsl(44 15% 80%)' }}>
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ background: 'hsl(28 71% 57% / 0.08)', borderBottom: '1px solid hsl(28 71% 57% / 0.15)' }}>
        <Trophy size={15} strokeWidth={1.5} style={{ color: 'hsl(28 71% 57%)' }} />
        <h3 className="font-bold text-sm">מובילי השבוע</h3>
      </div>
      <div className="divide-y divide-border/40">
        {entries.map((entry, i) => {
          const barPct = Math.round((entry.weekMinutes / maxMinutes) * 100);
          return (
            <div key={entry.userId}
              className={`flex items-center gap-3 px-4 py-3 ${entry.isMe ? 'bg-primary/5' : ''}`}>
              <span className="text-base w-6 text-center flex-shrink-0">
                {i < 3 ? MEDALS[i] : <span className="text-xs text-muted-foreground">{i + 1}</span>}
              </span>
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground"
                style={{ background: AVATAR_COLORS[entry.displayName.charAt(0)] ?? 'hsl(126 15% 28%)' }}
              >
                {entry.displayName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold truncate ${entry.isMe ? 'text-primary' : ''}`}>
                    {entry.isMe ? "אני" : entry.displayName}
                  </span>
                  <span className="text-xs font-numbers font-semibold text-muted-foreground flex-shrink-0 mr-2">
                    {entry.weekMinutes} דק׳
                  </span>
                </div>
                {entry.weekMinutes > 0 && (
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barPct}%`,
                        background: entry.isMe ? 'hsl(126 15% 28%)' : 'hsl(188 100% 27%)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
