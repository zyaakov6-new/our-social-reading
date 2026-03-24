import { useEffect, useState, useRef } from "react";
import { Heart, MessageCircle, Send, Trash2, BookOpen } from "lucide-react";
import { ReadingSession } from "@/hooks/useReadingSessions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGateModal from "./AuthGateModal";

const BookCover = ({ title, coverUrl }: { title: string; coverUrl: string | null }) => {
  const [idx, setIdx] = useState(0);
  const srcs = coverUrl ? [coverUrl] : [];
  const src = srcs[idx];
  if (src) {
    return (
      <div className="h-14 w-10 flex-shrink-0 rounded overflow-hidden shadow-sm">
        <img key={src} src={src} alt={title} className="h-full w-full object-cover" onError={() => setIdx(i => i + 1)} />
      </div>
    );
  }
  return (
    <div
      className="h-14 w-10 flex-shrink-0 rounded flex items-center justify-center shadow-sm"
      style={{ background: 'hsl(126 15% 28% / 0.12)' }}
    >
      <span className="text-[8px] font-bold text-primary text-center leading-tight px-0.5 font-serif">
        {title.slice(0, 10)}
      </span>
    </div>
  );
};

const AddToLibraryButton = ({ bookId, bookTitle, bookAuthor, coverUrl, onGate }: { bookId: string; bookTitle: string; bookAuthor: string; coverUrl?: string; onGate?: () => void }) => {
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(false);

  const addBook = async (status: 'want' | 'reading' | 'finished') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { onGate?.(); return; }
    // Check if already in library
    const { data: existing } = await supabase.from('books').select('id').eq('user_id', user.id).eq('title', bookTitle).maybeSingle();
    if (existing) { toast.success('הספר כבר בספרייה שלך'); setOpen(false); return; }
    const { error } = await supabase.from('books').insert({ user_id: user.id, title: bookTitle, author: bookAuthor || 'לא ידוע', status, cover_url: coverUrl || null });
    if (!error) {
      toast.success('הספר נוסף לספרייה! 📚');
      setAdded(true);
      window.dispatchEvent(new CustomEvent('bookAdded'));
    }
    setOpen(false);
  };

  if (added) return <span className="text-xs text-primary mr-auto font-medium">נוסף ✓</span>;

  return (
    <div className="mr-auto relative">
      {!open ? (
        <button
          onClick={() => onGate ? onGate() : setOpen(true)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <BookOpen size={13} strokeWidth={1.5} />
          <span>הוסף</span>
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <button onClick={() => addBook('want')} className="text-[11px] px-2 py-1 rounded-lg bg-muted hover:bg-accent transition-colors">רוצה</button>
          <button onClick={() => addBook('reading')} className="text-[11px] px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">קורא</button>
          <button onClick={() => addBook('finished')} className="text-[11px] px-2 py-1 rounded-lg bg-muted hover:bg-accent transition-colors">סיימתי</button>
          <button onClick={() => setOpen(false)} className="text-[11px] text-muted-foreground">✕</button>
        </div>
      )}
    </div>
  );
};

interface Comment {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

const FeedItemCard = ({ item }: { item: ReadingSession }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [countsReady, setCountsReady] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateAction, setGateAction] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openGate = (action: string) => { setGateAction(action); setGateOpen(true); };

  // On mount: fetch likes + comment count + current user in parallel
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const [
        { data: likes, error: likesErr },
        { data: commentsData, error: commentsErr },
        { data: { user } },
      ] = await Promise.all([
        supabase.from("session_likes").select("user_id").eq("session_id", item.id),
        supabase.from("session_comments").select("id").eq("session_id", item.id),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      if (!likesErr && likes) {
        setLikeCount(likes.length);
        setLiked(likes.some((l: any) => l.user_id === user?.id));
      }
      if (!commentsErr && commentsData) setCommentCount(commentsData.length);
      if (user) setCurrentUserId(user.id);
      setCountsReady(true);
    };
    init();
    return () => { cancelled = true; };
  }, [item.id]);

  // Load full comments only when thread is opened
  useEffect(() => {
    if (!showComments || commentsLoaded) return;
    fetchComments();
  }, [showComments]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("session_comments")
      .select("id, user_id, display_name, content, created_at")
      .eq("session_id", item.id)
      .order("created_at", { ascending: true });
    if (error) { console.warn("fetchComments:", error.message); return; }
    if (data) {
      setComments(data as Comment[]);
      setCommentCount(data.length);
      setCommentsLoaded(true);
    }
  };

  const toggleLike = async () => {
    if (!currentUserId) { openGate("לאהוב פוסטים"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    try {
      if (wasLiked) {
        await supabase.from("session_likes").delete().eq("session_id", item.id).eq("user_id", currentUserId);
      } else {
        await supabase.from("session_likes").insert({ session_id: item.id, user_id: currentUserId });
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    if (!currentUserId) { openGate("להגיב"); return; }
    setSubmitting(true);
    try {
      const [{ data: profile }, { data: { user: authUser } }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("user_id", currentUserId).maybeSingle(),
        supabase.auth.getUser(),
      ]);
      const displayName =
        (profile as any)?.display_name ||
        authUser?.user_metadata?.full_name ||
        authUser?.email?.split("@")[0] ||
        "קורא";

      const { data, error } = await supabase
        .from("session_comments")
        .insert({ session_id: item.id, user_id: currentUserId, display_name: displayName, content: commentText.trim() })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setComments(prev => [...prev, data as Comment]);
        setCommentCount(prev => prev + 1);
        setCommentText("");
      }
    } catch (e: any) {
      toast.error(e?.message || "שגיאה בשליחת התגובה");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("session_comments")
      .delete()
      .eq("id", commentId);
    if (error) {
      toast.error("שגיאה במחיקת תגובה");
      return;
    }
    setComments(prev => prev.filter(c => c.id !== commentId));
    setCommentCount(prev => Math.max(0, prev - 1));
  };

  // Deterministic avatar color from first character
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
  const firstChar = item.userName.charAt(0);
  const avatarBg = AVATAR_COLORS[firstChar] ?? 'hsl(126 15% 28%)';

  return (
    <>
    <AuthGateModal open={gateOpen} onClose={() => setGateOpen(false)} action={gateAction} />
    <div className="bg-card rounded-2xl overflow-hidden card-shadow animate-fade-slide-up"
      style={{ border: '1px solid hsl(44 15% 80%)' }}>

      {/* ── User + timestamp header band ── */}
      <div className="activity-band px-4 py-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground flex-shrink-0">{item.timestamp}</span>
        {item.isMe ? (
          <span className="text-xs font-bold" style={{ color: 'hsl(28 71% 57%)' }}>אני</span>
        ) : (
          <span className="text-xs font-semibold text-foreground truncate">{item.userName}</span>
        )}
      </div>

      {/* ── Activity body ── */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* User avatar */}
          <div
            className="h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center"
            style={{ background: avatarBg, boxShadow: `0 0 0 2px hsl(44 27% 84%), 0 0 0 3px ${avatarBg}40` }}
          >
            <span className="font-bold text-sm text-primary-foreground">{firstChar}</span>
          </div>
          {/* Book info */}
          <div className="flex-1 min-w-0">
            <p
              className="font-serif font-bold text-base text-foreground text-right leading-snug cursor-pointer hover:text-primary transition-colors"
              onClick={() => item.bookId ? navigate(`/book/${item.bookId}`) : undefined}
            >{item.bookTitle}</p>
            <div className="flex items-center gap-1.5 mt-1.5 justify-end flex-wrap">
              {item.minutesRead > 0 && (
                <span className="badge-green">⏱ {item.minutesRead} דק׳</span>
              )}
              {item.pagesRead > 0 && (
                <span className="badge-teal">📖 {item.pagesRead} עמ׳</span>
              )}
            </div>
          </div>
          {/* Book cover thumbnail */}
          <div
            className={item.bookId ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
            onClick={() => item.bookId ? navigate(`/book/${item.bookId}`) : undefined}
          >
            <BookCover title={item.bookTitle} coverUrl={item.coverUrl ?? null} />
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center gap-1 px-4 pb-3 border-t border-border/40 pt-2.5">
        {!countsReady ? (
          // Skeleton pills while counts load
          <>
            <Skeleton className="h-7 w-12 rounded-lg" />
            <Skeleton className="h-7 w-12 rounded-lg" />
          </>
        ) : (
          <>
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors ${
                liked ? "text-red-500 bg-red-50" : "text-muted-foreground hover:text-red-400 hover:bg-red-50/60"
              }`}
            >
              <Heart size={15} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} />
              {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
            </button>

            <button
              onClick={() => currentUserId ? setShowComments(v => !v) : openGate("להגיב ולראות תגובות")}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors ${
                showComments ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              <MessageCircle size={15} strokeWidth={1.5} />
              {commentCount > 0 && <span className="text-xs font-medium">{commentCount}</span>}
            </button>
            {!item.isMe && (
              <AddToLibraryButton
                bookId={item.bookId}
                bookTitle={item.bookTitle}
                bookAuthor={item.bookAuthor || ''}
                coverUrl={item.coverUrl}
                onGate={!currentUserId ? () => openGate("להוסיף ספרים לספרייה") : undefined}
              />
            )}
          </>
        )}
      </div>

      {/* Comments thread */}
      {showComments && (
        <div className="border-t border-border/40 bg-background/40">
          {!commentsLoaded ? (
            <div className="px-4 py-3 space-y-2">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-5 w-1/2 rounded" />
            </div>
          ) : (
            <>
              {comments.length > 0 && (
                <div className="px-4 pt-3 pb-2 space-y-2.5">
                  {comments.map(c => (
                    <div key={c.id} className="flex items-start gap-2.5 group">
                      <button
                        onClick={() => navigate(`/user/${c.user_id}`)}
                        className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ background: AVATAR_COLORS[c.display_name.charAt(0)] ?? 'hsl(126 15% 28%)' }}
                      >
                        <span className="text-[10px] font-semibold text-primary-foreground">
                          {c.display_name.charAt(0)}
                        </span>
                      </button>
                      <div className="flex-1 min-w-0 text-right">
                        <button
                          onClick={() => navigate(`/user/${c.user_id}`)}
                          className="font-semibold text-xs hover:text-primary transition-colors"
                        >
                          {c.display_name}
                        </button>
                        {" "}
                        <span className="text-xs text-foreground/80">{c.content}</span>
                      </div>
                      {c.user_id === currentUserId && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded text-muted-foreground/50 hover:text-red-400 transition-all"
                          title="מחק תגובה"
                        >
                          <Trash2 size={11} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">היה ראשון להגיב</p>
              )}
            </>
          )}
          <div className="flex items-center gap-2 px-3 pb-3 pt-1">
            <input
              ref={inputRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
              placeholder="הוסף תגובה..."
              dir="rtl"
              className="flex-1 text-sm bg-muted/50 border border-border/50 rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60 text-right"
            />
            <button
              onClick={submitComment}
              disabled={!commentText.trim() || submitting}
              className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
            >
              <Send size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default FeedItemCard;
