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

  return (
    <button
      onClick={() => navigate(`/challenge/${challenge.id}`)}
      className="w-full rounded-xl bg-card p-4 card-shadow text-right hover:card-shadow-hover transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <ChevronLeft size={18} className="text-muted-foreground" />
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-secondary" />
          <h3 className="font-serif font-bold text-sm">{challenge.name}</h3>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{daysLeft} ימים נותרו</span>
          <span className="text-xs font-semibold text-primary">
            {challenge.currentProgress}/{challenge.goalValue} {unit}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full reading-gradient transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {challenge.participants.slice(0, 3).map((p, i) => (
          <div
            key={i}
            className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold border-2 border-card -mr-1.5 first:mr-0"
          >
            {p.name.charAt(0)}
          </div>
        ))}
        <span className="text-xs text-muted-foreground mr-1">
          מיקומך: #{challenge.myRank}
        </span>
      </div>
    </button>
  );
};

export default ChallengeCard;
