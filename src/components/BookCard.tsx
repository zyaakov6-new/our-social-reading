import { Book } from "@/hooks/useBooks";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface BookCardProps {
  book: Book;
  compact?: boolean;
  onDelete?: (bookId: string) => void;
}

const BookCard = ({ book, compact, onDelete }: BookCardProps) => {
  const progress = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;

  const handleDelete = () => {
    onDelete?.(book.id);
    toast.success("הספר נמחק");
  };

  const colors = [
    "from-primary/80 to-primary/40",
    "from-secondary/80 to-secondary/40",
    "from-primary/60 to-accent/60",
    "from-secondary/60 to-streak/40",
  ];
  const colorClass = colors[parseInt(book.id, 36) % colors.length];

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-card p-3 card-shadow relative group">
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
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="absolute top-2 left-2 h-7 w-7 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} className="text-destructive" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>מחיקת ספר</AlertDialogTitle>
                <AlertDialogDescription className="text-right">
                  האם אתה בטוח שברצונך למחוק את "{book.title}"? פעולה זו לא ניתנת לביטול.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-start">
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  מחק
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  }

  return (
    <div className="w-28 flex-shrink-0 relative group">
      <div className={`h-40 w-full rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center card-shadow mb-2`}>
        <span className="text-xs font-bold text-primary-foreground text-center px-2 leading-tight font-serif">
          {book.title}
        </span>
      </div>
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="absolute top-1 right-1 h-7 w-7 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={14} className="text-destructive" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>מחיקת ספר</AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                האם אתה בטוח שברצונך למחוק את "{book.title}"? פעולה זו לא ניתנת לביטול.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-start">
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
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
