import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { searchBooks, BookSearchResult } from "@/services/googleBooks";
import { Search, BookOpen, X } from "lucide-react";

/**
 * Tries each URL in `srcs` in order; moves to the next on load failure.
 * Shows a 📖 placeholder only when every URL has failed or none provided.
 */
const CoverImg = ({ srcs, alt, className }: { srcs: string[]; alt: string; className?: string }) => {
  const [idx, setIdx] = useState(0);
  const src = srcs[idx];
  if (src) {
    return (
      <img
        key={src}
        src={src}
        alt={alt}
        className={className ?? 'h-full w-full object-cover'}
        onError={() => setIdx(i => i + 1)}
      />
    );
  }
  return <div className="h-full w-full flex items-center justify-center text-sm select-none">📖</div>;
};

interface AddBookDialogProps {
  onBookAdded?: () => void;
}

const AddBookDialog = ({ onBookAdded }: AddBookDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<BookSearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Book details (editable after selection, or manual fallback)
  const [manualMode, setManualMode] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");

  const [status, setStatus] = useState<"want" | "reading" | "finished">("want");

  // Search as user types (only when no book is selected)
  useEffect(() => {
    if (!query.trim() || selected || manualMode) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const books = await searchBooks(query);
        setResults(books);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, selected, manualMode]);

  const resetForm = () => {
    setQuery("");
    setResults([]);
    setSelected(null);
    setManualMode(false);
    setTitle("");
    setAuthor("");
    setTotalPages("");
    setStatus("want");
  };

  const handleSelect = (book: BookSearchResult) => {
    setSelected(book);
    setResults([]);
  };

  const handleClearSelection = () => {
    setSelected(null);
    setQuery("");
  };

  const handleSubmit = async () => {
    const bookTitle = selected ? selected.title : title.trim();
    const bookAuthor = selected ? selected.author : author.trim();
    const bookPages = selected ? selected.totalPages : (totalPages ? parseInt(totalPages, 10) : 0);
    const coverUrl = selected ? selected.coverUrl : null;

    if (!bookTitle || !bookAuthor) {
      toast.error("יש למלא שם ומחבר");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("לא מחובר");

      const { error } = await supabase.from("books").insert({
        user_id: user.id,
        title: bookTitle,
        author: bookAuthor,
        total_pages: bookPages,
        cover_url: coverUrl,
        current_page: 0,
        status,
      });

      if (error) throw error;

      toast.success("הספר נוסף!");
      setOpen(false);
      resetForm();
      onBookAdded?.();
    } catch (e: any) {
      toast.error(e.message || "שגיאה בהוספת הספר");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = selected || (manualMode && title.trim() && author.trim());

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <button className="w-full rounded-xl border-2 border-dashed border-primary/30 py-4 text-primary font-semibold hover:bg-primary/5 transition-colors">
          + הוסף ספר
        </button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center font-serif text-xl">הוספת ספר</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* ── Search input (hidden once a book is selected or in manual mode) ── */}
          {!selected && !manualMode && (
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="חפש ספר לפי שם או מחבר..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pr-9 text-right"
                autoFocus
              />
              {searching && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}

              {/* Dropdown results */}
              {results.length > 0 && (
                <div className="absolute top-full mt-1 right-0 left-0 z-50 rounded-xl border border-border bg-card shadow-lg max-h-64 overflow-y-auto">
                  {results.map(book => (
                    <button
                      key={book.googleBooksId}
                      type="button"
                      onClick={() => handleSelect(book)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors border-b border-border/50 last:border-0 text-right"
                    >
                      <div className="h-12 w-8 rounded flex-shrink-0 bg-muted overflow-hidden">
                        <CoverImg srcs={book.coverUrls ?? (book.coverUrl ? [book.coverUrl] : [])} alt={book.title} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {book.author}{book.totalPages > 0 && ` · ${book.totalPages} עמ׳`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Selected book preview ── */}
          {selected && (
            <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
              <div className="h-16 w-11 rounded flex-shrink-0 bg-background overflow-hidden shadow-sm">
                <CoverImg srcs={selected.coverUrls ?? (selected.coverUrl ? [selected.coverUrl] : [])} alt={selected.title} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif font-bold text-sm">{selected.title}</p>
                <p className="text-xs text-muted-foreground">{selected.author}</p>
                {selected.totalPages > 0 && (
                  <p className="text-xs text-muted-foreground">{selected.totalPages} עמודים</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="flex-shrink-0 h-6 w-6 rounded-full bg-background flex items-center justify-center hover:bg-accent transition-colors"
                title="חפש שוב"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* ── Manual entry form ── */}
          {manualMode && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">שם הספר</Label>
                <Input
                  id="title"
                  placeholder="שם הספר"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="text-right"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="author">מחבר</Label>
                <Input
                  id="author"
                  placeholder="שם המחבר"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="text-right"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pages">מספר עמודים (אופציונלי)</Label>
                <Input
                  id="pages"
                  type="number"
                  placeholder="0"
                  value={totalPages}
                  onChange={e => setTotalPages(e.target.value)}
                  className="text-right"
                  min="0"
                />
              </div>
            </div>
          )}

          {/* ── Switch between search and manual ── */}
          {!selected && (
            <button
              type="button"
              onClick={() => { setManualMode(!manualMode); setQuery(""); setResults([]); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              {manualMode ? "← חזרה לחיפוש" : "לא מצאת? הזן ידנית"}
            </button>
          )}

          {/* ── Status selector ── */}
          <div className="space-y-1.5">
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={v => setStatus(v as any)}>
              <SelectTrigger className="text-right">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="want">רוצה לקרוא</SelectItem>
                <SelectItem value="reading">קורא עכשיו</SelectItem>
                <SelectItem value="finished">סיימתי</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || loading} className="flex-1">
              {loading ? "שומר..." : "הוסף"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookDialog;
