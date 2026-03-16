import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Trophy, Users, Calendar } from "lucide-react";
import { useChallenges, Challenge } from "@/hooks/useChallenges";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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

const ChallengeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { challenges, loading, leaveChallenge } = useChallenges();
  const [leaving, setLeaving] = useState(false);

  const challenge: Challenge | undefined = challenges.find(c => c.id === id);

  const daysLeft = challenge
    ? Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const progressPct = challenge
    ? Math.min(100, Math.round((challenge.myProgress / challenge.goalValue) * 100))
    : 0;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const handleLeave = async () => {
    if (!challenge) return;
    setLeaving(true);
    try {
      await leaveChallenge(challenge.id);
      toast.success("עזבת את האתגר");
      navigate(-1);
    } catch {
      toast.error("שגיאה");
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-28 px-4 pt-6 max-w-md mx-auto space-y-4">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 pb-28">
        <p className="text-sm text-muted-foreground">האתגר לא נמצא</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary font-semibold">חזרה</button>
      </div>
    );
  }

  const unit = challenge.goalType === "minutes" ? "דקות" : "ספרים";

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md px-5 pt-5 pb-4"
        style={{
          background: 'linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)',
          borderBottom: '2px solid hsl(188 100% 27% / 0.22)',
        }}
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
          <h1 className="font-serif font-bold text-xl truncate flex-1">{challenge.name}</h1>
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto space-y-4">
        {/* Progress ring card */}
        <div className="rounded-2xl bg-card card-shadow p-6 text-center" style={{ border: '1px solid hsl(44 15% 80%)' }}>
          <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto mb-3">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(44 15% 80%)" strokeWidth="10" />
            <circle
              cx="70" cy="70" r={radius} fill="none"
              stroke="hsl(188 100% 27%)" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text x="70" y="65" textAnchor="middle" className="font-numbers" fontSize="26" fontWeight="800" fill="hsl(210 11% 14%)">
              {progressPct}%
            </text>
            <text x="70" y="84" textAnchor="middle" fontSize="11" fill="hsl(210 8% 42%)">
              {challenge.myProgress} / {challenge.goalValue} {unit}
            </text>
          </svg>
          <p className="font-serif font-bold text-lg">{challenge.name}</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="badge-teal"><Calendar size={11} /> {daysLeft} ימים נותרו</span>
            <span className="badge-green"><Users size={11} /> {challenge.participants.length} משתתפים</span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl bg-card card-shadow overflow-hidden" style={{ border: '1px solid hsl(44 15% 80%)' }}>
          <div className="flex items-center gap-2 px-4 py-3"
            style={{ background: 'hsl(188 100% 27% / 0.07)', borderBottom: '1px solid hsl(188 100% 27% / 0.12)' }}>
            <Trophy size={15} strokeWidth={1.5} style={{ color: 'hsl(28 71% 57%)' }} />
            <span className="font-bold text-sm">טבלת מובילים</span>
          </div>
          <div className="divide-y divide-border/40">
            {challenge.participants.map((p, i) => {
              const isMe = p.userId === user?.id;
              const pct = Math.min(100, Math.round((p.progress / challenge.goalValue) * 100));
              return (
                <div key={p.userId} className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-primary/5' : ''}`}>
                  <span className="text-lg w-6 text-center flex-shrink-0">{i < 3 ? MEDALS[i] : `${i + 1}`}</span>
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground"
                    style={{ background: AVATAR_COLORS[p.displayName.charAt(0)] ?? 'hsl(126 15% 28%)' }}
                  >
                    {p.displayName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : ''}`}>
                        {isMe ? `${p.displayName} (אני)` : p.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground font-numbers flex-shrink-0 mr-2">
                        {p.progress} {unit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: isMe ? 'hsl(126 15% 28%)' : 'hsl(188 100% 27%)' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave button — only for non-creators */}
        {challenge.creatorId !== user?.id && (
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full rounded-xl border border-destructive/40 py-3 text-sm text-destructive font-semibold hover:bg-destructive/5 transition-colors"
          >
            {leaving ? "עוזב..." : "עזוב אתגר"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChallengeDetail;
