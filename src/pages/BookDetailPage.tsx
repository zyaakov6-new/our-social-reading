import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import LogReadingDialog from "@/components/LogReadingDialog";
import type { Book } from "@/hooks/useBooks";

interface BookDetail {
  id: string;
  userId: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  coverUrl?: string;
  status: "reading" | "finished" | "want";
  createdAt: string;
  updatedAt: string;
}

interface ReadingSession {
  id: string;
  minutesRead: number;
  pagesRead: number;
  sessionDate: string;
  createdAt: string;
}

interface OtherReader {
  userId: string;
  displayName: string;
}

const STATUS_LABELS: Record<string, string> = {
  reading: "קורא עכשיו",
  finished: "סיימתי",
  want: "רוצה לקרוא",
};

const STATUS_COLORS: Record<string, string> = {
  reading: "hsl(126 15% 28%)",
  finished: "hsl(188 60% 35%)",
  want: "hsl(28 71% 57%)",
};

const AVATAR_COLORS: Record<string, string> = {
  א: "hsl(126 15% 28%)", ב: "hsl(188 100% 27%)", ג: "hsl(28 71% 57%)",
  ד: "hsl(126 18% 38%)", ה: "hsl(188 80% 32%)", ו: "hsl(22 65% 50%)",
  ז: "hsl(126 12% 45%)", ח: "hsl(188 60% 35%)", ט: "hsl(28 55% 48%)",
  י: "hsl(126 20% 32%)", כ: "hsl(188 90% 24%)", ל: "hsl(28 65% 52%)",
  מ: "hsl(126 15% 28%)", נ: "hsl(188 100% 27%)", ס: "hsl(28 71% 57%)",
  ע: "hsl(126 18% 38%)", פ: "hsl(188 80% 32%)", צ: "hsl(22 65% 50%)",
  ק: "hsl(126 12% 45%)", ר: "hsl(188 60% 35%)", ש: "hsl(28 55% 48%)",
  ת: "hsl(126 20% 32%)",
};

function avatarColor(name: string): string {
  const first = name.charAt(0);
  return AVATAR_COLORS[first] ?? "hsl(126 15% 28%)";
}

const BookDetailPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [otherReaders, setOtherReaders] = useState<OtherReader[]>([]);
  const [loading, setLoading] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!bookId) return;
    fetchAll();
  }, [bookId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: bookData }, { data: sessionsData }] = await Promise.all([
        supabase
          .from("books")
          .select(
            "id, user_id, title, author, total_pages, current_page, cover_url, status, created_at, updated_at"
          )
          .eq("id", bookId!)
          .maybeSingle(),
        supabase
          .from("reading_sessions")
          .select("id, minutes_read, pages_read, session_date, created_at")
          .eq("book_id", bookId!)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (bookData) {
        const b = bookData as any;
        setBook({
          id: b.id,
          userId: b.user_id,
          title: b.title,
          author: b.author,
          totalPages: b.total_pages ?? 0,
          currentPage: b.current_page ?? 0,
          coverUrl: b.cover_url ?? undefined,
          status: (b.status ?? "want") as "reading" | "finished" | "want",
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        });
        setIsOwner(b.user_id === user.id);

        // Fetch other readers — case-insensitive title match
        const { data: otherBooks } = await supabase
          .from("books")
          .select("user_id")
          .ilike("title", b.title.trim())
          .neq("user_id", user.id)
          .limit(10);

        if (otherBooks && otherBooks.length > 0) {
          const userIds = (otherBooks as any[]).map((ob) => ob.user_id);
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", userIds);

          if (profilesData) {
            setOtherReaders(
              (profilesData as any[]).map((p) => ({
                userId: p.user_id,
                displayName: p.display_name || "קורא",
              }))
            );
          }
        }
      }

      if (sessionsData) {
        setSessions(
          (sessionsData as any[]).map((s) => ({
            id: s.id,
            minutesRead: s.minutes_read,
            pagesRead: s.pages_read,
            sessionDate: s.session_date,
            createdAt: s.created_at,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: "reading" | "finished" | "want") => {
    if (!book || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("books")
        .update({ status: newStatus })
        .eq("id", book.id);
      if (error) throw error;
      setBook((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success("הסטטוס עודכן!");
    } catch (e: any) {
      toast.error(e?.message || "שגיאה בעדכון סטטוס");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Compute stats
  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutesRead, 0);
  const totalPagesRead = sessions.reduce((sum, s) => sum + s.pagesRead, 0);
  const recentSessions = sessions.slice(0, 5);
  const progress =
    book && book.totalPages > 0
      ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
      : null;

  if (loading) {
    return (
      <div className="min-h-screen pb-28 bg-background" dir="rtl">
        {/* Header skeleton */}
        <div
          className="sticky top-0 z-30 backdrop-blur-md pr-5 pl-4 pt-3 pb-2.5 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)",
            borderBottom: "2px solid hsl(126 15% 28% / 0.20)",
          }}
        >
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-40 rounded" />
        </div>
        <div className="px-4 pt-5 max-w-md mx-auto space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-36 w-24 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3 pt-1">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background"
        dir="rtl"
      >
        <p className="text-muted-foreground text-sm">ספר לא נמצא</p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary text-sm font-medium"
        >
          חזור
        </button>
      </div>
    );
  }

  // Build a Book-compatible object for LogReadingDialog
  const bookForDialog: Book = {
    id: book.id,
    title: book.title,
    author: book.author,
    totalPages: book.totalPages,
    currentPage: book.currentPage,
    status: book.status,
    coverUrl: book.coverUrl,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };

  const statusColor = STATUS_COLORS[book.status] ?? STATUS_COLORS.want;
  const statusLabel = STATUS_LABELS[book.status] ?? book.status;

  return (
    <div className="min-h-screen pb-28 bg-background" dir="rtl">
      {/* Header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md pr-5 pl-4 pt-3 pb-2.5"
        style={{
          background:
            "linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)",
          borderBottom: "2px solid hsl(126 15% 28% / 0.20)",
        }}
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors flex-shrink-0"
          >
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <span
              style={{
                display: "block",
                width: "3px",
                height: "30px",
                background: "hsl(126 15% 28%)",
                borderRadius: "2px",
                flexShrink: 0,
              }}
            />
            <div className="min-w-0">
              <h1 className="font-display text-[1.75rem] tracking-[0.14em] leading-none">
                AMUD
              </h1>
              <p className="font-quote text-[10px] text-muted-foreground mt-0.5 truncate">
                {book.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-md mx-auto space-y-4">
        {/* Book info card */}
        <div
          className="bg-card rounded-2xl p-4 flex gap-4"
          style={{
            border: "1px solid hsl(44 15% 80%)",
            boxShadow: "0 1px 4px hsl(44 20% 70% / 0.25)",
          }}
        >
          {/* Cover */}
          <div className="h-36 w-24 rounded-xl flex-shrink-0 overflow-hidden bg-muted shadow-sm">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <BookOpen size={28} className="text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <h2 className="font-serif font-bold text-base leading-snug line-clamp-2">
              {book.title}
            </h2>
            <p className="text-sm text-muted-foreground">{book.author}</p>

            {/* Status badge */}
            <span
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full text-white"
              style={{ background: statusColor }}
            >
              {statusLabel}
            </span>

            {book.totalPages > 0 && (
              <p className="text-xs text-muted-foreground">
                {book.totalPages} עמודים
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div
            className="bg-card rounded-xl px-4 py-3 space-y-2"
            style={{ border: "1px solid hsl(44 15% 80%)" }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">התקדמות</span>
              <span className="font-semibold" style={{ color: statusColor }}>
                {progress}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: statusColor }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-left">
              עמוד {book.currentPage} מתוך {book.totalPages}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="bg-card rounded-xl p-3 flex items-center gap-3"
            style={{ border: "1px solid hsl(44 15% 80%)" }}
          >
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(126 15% 91%)" }}
            >
              <Clock size={16} style={{ color: "hsl(126 15% 28%)" }} />
            </div>
            <div>
              <p className="text-base font-bold leading-tight">{totalMinutes}</p>
              <p className="text-[10px] text-muted-foreground">דקות קריאה</p>
            </div>
          </div>
          <div
            className="bg-card rounded-xl p-3 flex items-center gap-3"
            style={{ border: "1px solid hsl(44 15% 80%)" }}
          >
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(188 60% 91%)" }}
            >
              <FileText size={16} style={{ color: "hsl(188 60% 35%)" }} />
            </div>
            <div>
              <p className="text-base font-bold leading-tight">{totalPagesRead}</p>
              <p className="text-[10px] text-muted-foreground">עמודים נקראו</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {isOwner && book.status === "reading" && (
            <button
              onClick={() => setLogOpen(true)}
              className="flex-1 min-w-0 rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: "hsl(126 15% 28%)" }}
            >
              + תעד קריאה
            </button>
          )}
        </div>

        {/* Status change buttons - only for book owner */}
        {isOwner && <div
          className="bg-card rounded-xl p-3 space-y-2"
          style={{ border: "1px solid hsl(44 15% 80%)" }}
        >
          <p className="text-xs text-muted-foreground font-semibold">שנה סטטוס</p>
          <div className="flex gap-2 flex-wrap">
            {(["reading", "finished", "want"] as const).map((s) => (
              <button
                key={s}
                disabled={book.status === s || updatingStatus}
                onClick={() => updateStatus(s)}
                className="flex-1 min-w-0 rounded-lg py-2 text-xs font-semibold transition-all disabled:opacity-50"
                style={
                  book.status === s
                    ? { background: STATUS_COLORS[s], color: "white" }
                    : {
                        background: "hsl(44 20% 91%)",
                        color: "hsl(210 11% 30%)",
                      }
                }
              >
                {s === "reading"
                  ? "מתחיל לקרוא"
                  : s === "finished"
                  ? "סיימתי"
                  : "רוצה לקרוא"}
              </button>
            ))}
          </div>
        </div>}

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <div className="space-y-2">
            <h3 className="section-heading">סשנים אחרונים</h3>
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-card rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ border: "1px solid hsl(44 15% 80%)" }}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {s.minutesRead} דקות
                      {s.pagesRead > 0 ? ` · ${s.pagesRead} עמודים` : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(s.sessionDate).toLocaleDateString("he-IL", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(126 15% 91%)" }}
                  >
                    <BookOpen size={14} style={{ color: "hsl(126 15% 28%)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other readers */}
        {otherReaders.length > 0 && (
          <div className="space-y-2">
            <h3 className="section-heading">מי עוד קורא את הספר הזה?</h3>
            <div
              className="bg-card rounded-2xl p-4"
              style={{ border: "1px solid hsl(44 15% 80%)" }}
            >
              <div className="flex flex-wrap gap-3">
                {otherReaders.map((reader) => {
                  const initial = reader.displayName.charAt(0);
                  return (
                    <button
                      key={reader.userId}
                      onClick={() => navigate(`/user/${reader.userId}`)}
                      className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ background: avatarColor(reader.displayName) }}
                      >
                        <span className="text-sm font-bold text-white">
                          {initial}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground max-w-[48px] truncate">
                        {reader.displayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Reading Dialog */}
      <LogReadingDialog
        book={bookForDialog}
        open={logOpen}
        onOpenChange={setLogOpen}
        onSaved={fetchAll}
      />
    </div>
  );
};

export default BookDetailPage;
