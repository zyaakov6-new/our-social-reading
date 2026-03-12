import { Book } from "@/lib/mockData";

interface BookCardProps {
  book: Book;
  compact?: boolean;
}

const BookCard = ({ book, compact }: BookCardProps) => {
  const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

  // Generate a warm color based on book id for the placeholder cover
  const colors = [
    "from-primary/80 to-primary/40",
    "from-secondary/80 to-secondary/40",
    "from-primary/60 to-accent/60",
    "from-secondary/60 to-streak/40",
  ];
  const colorClass = colors[parseInt(book.id) % colors.length];

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-card p-3 card-shadow">
        <div className={`h-16 w-11 flex-shrink-0 rounded-md bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-primary-foreground leading-tight text-center px-0.5 font-serif">
            {book.title.slice(0, 8)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif font-bold text-sm truncate">{book.title}</h4>
          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
          {book.status === 'reading' && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full reading-gradient transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-primary">{progress}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-28 flex-shrink-0">
      <div className={`h-40 w-full rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center card-shadow mb-2`}>
        <span className="text-xs font-bold text-primary-foreground text-center px-2 leading-tight font-serif">
          {book.title}
        </span>
      </div>
      <h4 className="font-serif font-bold text-xs truncate">{book.title}</h4>
      <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
      {book.status === 'reading' && (
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full reading-gradient"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-primary">{progress}%</span>
        </div>
      )}
    </div>
  );
};

export default BookCard;
