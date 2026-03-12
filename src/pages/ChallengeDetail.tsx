import { useParams, useNavigate } from "react-router-dom";
import { mockChallenges } from "@/lib/mockData";
import { ArrowRight, Trophy, Share2, LogOut } from "lucide-react";

const ChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const challenge = mockChallenges.find(c => c.id === id);

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">אתגר לא נמצא</p>
      </div>
    );
  }

  const progress = Math.round((challenge.currentProgress / challenge.goalValue) * 100);
  const unit = challenge.goalType === 'minutes' ? 'דקות' : 'ספרים';
  const endDate = new Date(challenge.endDate);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const circumference = 2 * Math.PI * 60;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowRight size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-lg font-bold">{challenge.name}</h1>
          <p className="text-xs text-muted-foreground">{daysLeft} ימים נותרו</p>
        </div>
        <Trophy size={22} className="text-secondary" />
      </div>

      <div className="px-4 max-w-md mx-auto space-y-4">
        {/* Circular Progress */}
        <div className="rounded-xl bg-card p-6 card-shadow text-center">
          <div className="relative mx-auto h-36 w-36 mb-4">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle cx="70" cy="70" r="60" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="70" cy="70" r="60"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - Math.min(progress / 100, 1))}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{progress}%</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            קראתי <span className="font-semibold text-foreground">{challenge.currentProgress}</span> מתוך{" "}
            <span className="font-semibold text-foreground">{challenge.goalValue}</span> {unit}
          </p>
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl bg-card p-4 card-shadow">
          <h3 className="font-serif font-bold text-sm mb-3">🏆 טבלת מובילים</h3>
          <div className="space-y-2">
            {challenge.participants.map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  p.name === 'אתה' ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/50'
                }`}
              >
                <span className={`text-lg font-bold w-6 text-center ${
                  i === 0 ? 'text-secondary' : 'text-muted-foreground'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </span>
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-xs font-semibold">{p.name.charAt(0)}</span>
                </div>
                <span className={`flex-1 text-sm ${p.name === 'אתה' ? 'font-bold' : 'font-medium'}`}>
                  {p.name}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {p.progress} {unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-primary-foreground font-semibold">
            <Share2 size={16} />
            הזמן חברים
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-muted-foreground text-sm">
            <LogOut size={14} />
            צא
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetail;
