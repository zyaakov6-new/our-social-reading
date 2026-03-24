import { Trophy, ChevronLeft } from "lucide-react";
import { Challenge } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";

const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
  const navigate = useNavigate();
  const progress = Math.round((challenge.currentProgress / challenge.goalValue) * 100);
  const unit = challenge.goalType === 'minutes' ? 'דקות' : 'ספרים';

  const endDate = new Date(challenge.endDate);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

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

  return (
    <button
      onClick={() => navigate(`/challenge/${challenge.id}`)}
      className="w-full rounded-2xl bg-card card-shadow text-right hover:bg-accent/20 transition-all duration-200 overflow-hidden"
      style={{ border: '1px solid hsl(44 15% 80%)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid hsl(44 12% 76% / 0.6)' }}
      >
        <div className="flex items-center gap-1.5">
          <ChevronLeft size={16} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{daysLeft} ימים נותרו</span>
        </div>
        <div className="flex items-center gap-2">
          <h3 className="font-serif font-bold text-sm">{challenge.name}</h3>
          <Trophy size={16} style={{ color: 'hsl(188 100% 27%)' }} />
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-primary">{progress}%</span>
          <span className="text-xs font-semibold text-foreground">
            {challenge.currentProgress} / {challenge.goalValue} {unit}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full community-gradient transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Participants footer */}
      <div className="flex items-center gap-2 px-4 pb-3 overflow-hidden">
        <div className="flex items-center flex-shrink-0">
          {challenge.participants.slice(0, 3).map((p, i) => (
            <div
              key={i}
              className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground border-2 border-card -mr-2 first:mr-0"
              style={{ background: AVATAR_COLORS[p.name.charAt(0)] ?? 'hsl(126 15% 28%)' }}
            >
              {p.name.charAt(0)}
            </div>
          ))}
        </div>
        {challenge.isParticipant !== false && (
          <span className="text-xs text-muted-foreground mr-3">מיקומך: <strong className="text-foreground">#{challenge.myRank}</strong></span>
        )}
      </div>
    </button>
  );
};

export default ChallengeCard;
