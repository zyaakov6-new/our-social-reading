import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Trophy, Users, Calendar, Copy, Check } from "lucide-react";
import { useChallenges, Challenge } from "@/hooks/useChallenges";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  const { challenges, loading, leaveChallenge, joinChallenge, refetch } = useChallenges();
  const [leaving, setLeaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  // For invite-link flow: fetch challenge from DB directly if not in useChallenges
  const [publicChallenge, setPublicChallenge] = useState<any>(null);
  const [fetchingPublic, setFetchingPublic] = useState(false);

  const challenge: Challenge | undefined = challenges.find(c => c.id === id);

  // If challenge not found after loading, try direct fetch (invite link scenario)
  useEffect(() => {
    if (loading || challenge || !id) return;
    setFetchingPublic(true);
    supabase
      .from("challenges")
      .select("id, name, goal_type, goal_value, start_date, end_date, creator_id")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setPublicChallenge(data);
        setFetchingPublic(false);
      });
  }, [loading, challenge, id]);

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

  const handleJoin = async (challengeId: string) => {
    setJoining(true);
    try {
      await joinChallenge(challengeId);
      toast.success("הצטרפת לאתגר! 🎯");
      await refetch();
      setPublicChallenge(null);
    } catch (e: any) {
      toast.error(e?.message || "שגיאה");
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/challenge/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("הקישור הועתק - שלח לחבר שלך 🔗");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("לא הצלחנו להעתיק");
    });
  };

  if (loading || fetchingPublic) {
    return (
      <div className="min-h-screen pb-28 px-4 pt-6 max-w-md mx-auto space-y-4">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  // Invite-link flow: challenge exists in DB but user is not a participant yet
  if (!challenge && publicChallenge) {
    const unitLabel = publicChallenge.goal_type === "minutes" ? "דקות" : "ספרים";
    const days = Math.max(0, Math.ceil((new Date(publicChallenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return (
      <div className="min-h-screen pb-28">
        <div
          className="sticky top-0 z-30 backdrop-blur-md px-5 pt-5 pb-4"
          style={{
            background: 'linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)',
            borderBottom: '2px solid hsl(126 15% 28% / 0.20)',
          }}
        >
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowRight size={18} strokeWidth={1.5} />
            </button>
            <h1 className="font-serif font-bold text-xl truncate flex-1">{publicChallenge.name}</h1>
          </div>
        </div>
        <div className="px-4 py-6 max-w-md mx-auto">
          <div className="rounded-2xl bg-card card-shadow p-6 text-center space-y-4" style={{ border: '1px solid hsl(44 15% 80%)' }}>
            <Trophy size={40} className="mx-auto" style={{ color: 'hsl(28 71% 57%)' }} />
            <div>
              <h2 className="font-serif font-bold text-2xl mb-1">{publicChallenge.name}</h2>
              <p className="text-sm text-muted-foreground">
                יעד: {publicChallenge.goal_value} {unitLabel} • {days} ימים נותרו
              </p>
            </div>
            <p className="text-sm text-foreground/80">הוזמנת להצטרף לאתגר הקריאה הזה!</p>
            <Button
              className="w-full btn-cta text-base py-6"
              onClick={() => handleJoin(publicChallenge.id)}
              disabled={joining}
            >
              {joining ? "מצטרף..." : "הצטרף לאתגר 🎯"}
            </Button>
          </div>
        </div>
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
          borderBottom: '2px solid hsl(126 15% 28% / 0.20)',
        }}
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
          <h1 className="font-serif font-bold text-xl truncate flex-1">{challenge.name}</h1>
          <button
            onClick={handleCopyLink}
            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0"
            title="העתק קישור הזמנה"
          >
            {copied ? <Check size={16} strokeWidth={2} className="text-primary" /> : <Copy size={16} strokeWidth={1.5} className="text-muted-foreground" />}
          </button>
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
          <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
            <span className="badge-teal"><Calendar size={11} /> {daysLeft} ימים נותרו</span>
            <span className="badge-green"><Users size={11} /> {challenge.participants.length} משתתפים</span>
          </div>
          {/* Invite link button */}
          <button
            onClick={handleCopyLink}
            className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors"
            style={{ background: 'hsl(28 71% 57% / 0.12)', color: 'hsl(28 55% 38%)' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "הקישור הועתק!" : "הזמן חבר - העתק קישור"}
          </button>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl bg-card card-shadow overflow-hidden" style={{ border: '1px solid hsl(44 15% 80%)' }}>
          <div className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: '1px solid hsl(44 12% 76% / 0.6)' }}>
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

        {/* Leave button - only for non-creators */}
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
