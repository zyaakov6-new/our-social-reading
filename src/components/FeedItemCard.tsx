import { Heart, MessageCircle } from "lucide-react";
import { ReadingSession } from "@/hooks/useReadingSessions";

const FeedItemCard = ({ item }: { item: ReadingSession }) => {
  return (
    <div className="rounded-xl bg-card p-4 card-shadow">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-accent flex items-center justify-center">
          <span className="font-serif font-bold text-sm text-accent-foreground">
            {item.userName.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">{item.userName}</span>
            {" "}קרא/ה{" "}
            <span className="font-semibold text-primary">{item.minutesRead} דקות</span>
            {item.pagesRead > 0 && (
              <>
                {" • "}
                <span className="font-semibold text-primary">{item.pagesRead} עמודים</span>
              </>
            )}
            {" "}של{" "}
            <span className="font-serif font-semibold">"{item.bookTitle}"</span>
          </p>
          <span className="text-xs text-muted-foreground mt-0.5 block">{item.timestamp}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-secondary transition-colors text-sm">
          <Heart size={16} />
          <span>{item.likes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm">
          <MessageCircle size={16} />
          <span>{item.comments}</span>
        </button>
      </div>
    </div>
  );
};

export default FeedItemCard;
