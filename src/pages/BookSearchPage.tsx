import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { toast } from "sonner";
import AuthGateModal from "@/components/AuthGateModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { searchBooks, type BookSearchResult } from "@/services/googleBooks";

type ShelfStatus = "want" | "reading" | "finished";

const BookSearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, dir } = useLanguage();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const initialQuery = searchParams.get("q") ?? "";
  const source = searchParams.get("source") ?? "search_page";
  const variant = searchParams.get("variant") ?? "unknown";
  const showLandingGuide = source === "landing";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [status, setStatus] = useState<ShelfStatus>("want");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    trackEvent("book_search_viewed", {
      source,
      variant,
      hasQuery: initialQuery.trim().length > 0,
    });
  }, [initialQuery, source, variant]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const nextResults = await searchBooks(trimmed);
        setResults(nextResults);
      } catch {
        toast.error(t.common.error);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query, t.common.error]);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  const handleAddBook = async (book: BookSearchResult) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      trackEvent("book_save_blocked", {
        source,
        variant,
        action: "save_book",
      });
      setGateOpen(true);
      return;
    }

    setSavingId(book.googleBooksId);
    try {
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", book.title)
        .eq("author", book.author)
        .maybeSingle();

      if (existing) {
        toast.success(t.feed_item.alreadyInLib);
        navigate("/books");
        return;
      }

      const { error } = await supabase.from("books").insert({
        user_id: user.id,
        title: book.title,
        author: book.author,
        total_pages: book.totalPages,
        current_page: 0,
        cover_url: book.coverUrl,
        status,
      });

      if (error) throw error;

      trackEvent("book_added", { status, source: "search" });
      window.dispatchEvent(new CustomEvent("bookAdded"));
      toast.success(t.feed_item.addedToLib);
      navigate("/books");
    } catch (error) {
      const message = error instanceof Error ? error.message : t.common.error;
      toast.error(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen pb-28 bg-background" dir={dir}>
      <AuthGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        action={t.books.saveBookAction}
        nextPath={`${location.pathname}${location.search}`}
        source={source}
        variant={variant}
      />

      <div
        className="sticky top-0 z-30 backdrop-blur-md pr-5 pl-4 pt-3 pb-2.5"
        style={{
          background:
            "linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)",
          borderBottom: "2px solid hsl(126 15% 28% / 0.20)",
        }}
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate(-1)}>
            <ArrowRight size={20} strokeWidth={1.5} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-[1.75rem] tracking-[0.14em] leading-none">AMUD</h1>
            <p className="font-quote text-[10px] text-muted-foreground mt-0.5">{t.books.addBookTitle}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto space-y-4">
        {showLandingGuide && (
          <Alert className="border-primary/20 bg-primary/5">
            <AlertTitle>{t.books.trialTitle}</AlertTitle>
            <AlertDescription className="space-y-1 text-xs leading-relaxed">
              <p>{t.books.trialBody}</p>
              <p>{t.books.trialFootnote}</p>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border/60 card-shadow">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  setSearchParams(nextQuery.trim() ? { q: nextQuery } : {});
                }}
                placeholder={t.books.searchPlaceholder}
                className="pr-9 text-right"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">{t.books.statusLabel}</p>
              <Select value={status} onValueChange={(value: ShelfStatus) => setStatus(value)}>
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want">{t.books.statusWant}</SelectItem>
                  <SelectItem value="reading">{t.books.statusReading}</SelectItem>
                  <SelectItem value="finished">{t.books.statusFinished}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <>
            {[1, 2, 3].map((item) => (
              <Card key={item} className="border-border/60">
                <CardContent className="p-4 flex items-center gap-3">
                  <Skeleton className="h-16 w-11 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!loading && hasQuery && results.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="p-8 text-center space-y-2">
              <p className="text-sm font-semibold">{t.books.noResultsTitle}</p>
              <p className="text-xs text-muted-foreground">{t.books.notFound}</p>
            </CardContent>
          </Card>
        )}

        {!loading &&
          results.map((book) => (
            <Card key={book.googleBooksId} className="border-border/60 card-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-16 w-11 rounded-md overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <BookOpen size={16} className="text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <p className="font-serif font-bold text-sm line-clamp-2">{book.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
                  {book.totalPages > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">{t.books.pagesCount(book.totalPages)}</p>
                  )}
                </div>

                <Button type="button" onClick={() => handleAddBook(book)} disabled={savingId === book.googleBooksId} className="flex-shrink-0">
                  {savingId === book.googleBooksId ? t.common.saving : t.books.addBtn}
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default BookSearchPage;
