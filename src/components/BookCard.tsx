import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Book } from "@/hooks/useBooks";
import { Trash2, PlusCircle, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import LogReadingDialog from "./LogReadingDialog";

const STATUS_OPTIONS: { value: 'reading' | 'finished' | 'want' | 'abandoned'; label: string }[] = [
  { value: 'reading', label: 'קורא עכשיו' },
  { value: 'want', label: 'רוצה לקרוא' },
  { value: 'finished', label: 'סיימתי' },
  { value: 'abandoned', label: 'לא סיימתי' },
];

interface BookCardProps {
  book: Book;
  compact?: boolean;
  onDelete?: (bookId: string) => void;
  onLogSaved?: () => void;
  onStatusChange?: (bookId: string, status: 'reading' | 'finished' | 'want' | 'abandoned') => void;
}

const BookCard = ({ book, compact, onDelete, onLogSaved, onStatusChange }: BookCardProps) => {
  const navigate = useNavigate();
  const [logOpen, setLogOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
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

  // ── Compact view (used for "Reading now" list) ──────────────────────────
  if (compact) {
    return (
      <>
        <div
          className="flex items-center gap-3 rounded-xl bg-card p-3 card-shadow relative group transition-shadow hover:card-shadow-hover"
          style={{ border: '1px solid hsl(44 15% 80%)' }}
        >
          {/* Cover / fallback */}
          <div className={`h-16 w-11 flex-shrink-0 rounded-md overflow-hidden ${!book.coverUrl ? `bg-gradient-to-br ${colorClass} flex items-center justify-center` : ''}`}>
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
                onError={e => {
                  const el = e.currentTarget;
                  el.style.display = 'none';
                  el.parentElement!.classList.add(`bg-gradient-to-br`, ...colorClass.split(' '));
                }}
              />
            ) : (
              <span className="text-[10px] font-bold text-primary-foreground leading-tight text-center px-0.5 font-serif">
                {book.title.slice(0, 8)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className="font-serif font-bold text-sm truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/book/${book.id}`)}
            >{book.title}</h4>
            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
            {book.status === 'reading' && (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full reading-gradient transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-primary">{progress}%</span>
                </div>
                {book.currentPage > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    עמוד {book.currentPage}{book.totalPages > 0 ? ` מתוך ${book.totalPages}` : ''}
                  </p>
                )}
              </div>
            )}
            {book.status !== 'reading' && book.currentPage > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                עמוד {book.currentPage}{book.totalPages > 0 ? ` / ${book.totalPages}` : ''}
              </p>
            )}
          </div>

          {/* Log reading button - always visible */}
          <button
            onClick={() => setLogOpen(true)}
            className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors flex-shrink-0"
            title="תעד קריאה"
          >
            <PlusCircle size={16} className="text-primary" />
          </button>

          {/* Status change popover */}
          {onStatusChange && (
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
              <PopoverTrigger asChild>
                <button
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0"
                  title="שנה סטטוס"
                >
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1" align="end" dir="rtl">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onStatusChange(book.id, opt.value); setStatusOpen(false); }}
                    className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-colors ${
                      book.status === opt.value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}

          {/* Delete button - hover only */}
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

        <LogReadingDialog
          book={book}
          open={logOpen}
          onOpenChange={setLogOpen}
          onSaved={onLogSaved}
        />
      </>
    );
  }

  // ── Card view (used for horizontal-scroll "Finished" / "Want to read") ──
  return (
    <>
      <div className="w-28 flex-shrink-0 relative group">
        {/* Cover / fallback */}
        <div className={`h-40 w-full rounded-lg overflow-hidden card-shadow mb-2 transition-shadow group-hover:card-shadow-hover ${!book.coverUrl ? `bg-gradient-to-br ${colorClass} flex items-center justify-center` : ''}`}>
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-full w-full object-cover"
              onError={e => {
                const el = e.currentTarget;
                el.style.display = 'none';
                el.parentElement!.classList.add(`bg-gradient-to-br`, ...colorClass.split(' '));
              }}
            />
          ) : (
            <span className="text-xs font-bold text-primary-foreground text-center px-2 leading-tight font-serif">
              {book.title}
            </span>
          )}

          {/* Log reading overlay button */}
          <button
            onClick={() => setLogOpen(true)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            title="תעד קריאה"
          >
            <PlusCircle size={15} className="text-white" />
          </button>
        </div>

        {/* Delete button */}
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

        <div className="flex items-center justify-between gap-1">
          <h4
            className="font-serif font-bold text-xs truncate flex-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/book/${book.id}`)}
          >{book.title}</h4>
          {onStatusChange && (
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
              <PopoverTrigger asChild>
                <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-colors flex-shrink-0">
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1" align="end" dir="rtl">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onStatusChange(book.id, opt.value); setStatusOpen(false); }}
                    className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-colors ${
                      book.status === opt.value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{book.author}</p>
        {book.currentPage > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            עמוד {book.currentPage}{book.totalPages > 0 ? ` / ${book.totalPages}` : ''}
          </p>
        )}
        {book.status === 'reading' && progress > 0 && (
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

      <LogReadingDialog
        book={book}
        open={logOpen}
        onOpenChange={setLogOpen}
        onSaved={onLogSaved}
      />
    </>
  );
};

export default BookCard;
