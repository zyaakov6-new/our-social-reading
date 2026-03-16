import { useEffect, useState, useRef } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { ReadingSession } from "@/hooks/useReadingSessions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

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
  // null = still loading, number/bool = loaded
  const [countsReady, setCountsReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!currentUserId) return;
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
    if (!currentUserId) { toast.error("יש להתחבר כדי להגיב"); return; }
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
    <div className="bg-card rounded-2xl overflow-hidden card-shadow animate-fade-slide-up"
      style={{ border: '1px solid hsl(44 15% 80%)' }}>

      {/* ── Book title header band ── */}
      <div className="activity-band px-4 py-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground flex-shrink-0">{item.timestamp}</span>
        <span className="font-serif font-semibold text-sm text-primary truncate text-right">
          «{item.bookTitle}»
        </span>
      </div>

      {/* ── Activity body ── */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="h-11 w-11 flex-shrink-0 rounded-full flex items-center justify-center"
            style={{ background: avatarBg, boxShadow: `0 0 0 3px hsl(44 27% 84%), 0 0 0 4px ${avatarBg}40` }}
          >
            <span className="font-bold text-base text-primary-foreground">{firstChar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground text-right">{item.userName}</p>
            <div className="flex items-center gap-1.5 mt-1.5 justify-end flex-wrap">
              {item.minutesRead > 0 && (
                <span className="badge-green">⏱ {item.minutesRead} דק׳</span>
              )}
              {item.pagesRead > 0 && (
                <span className="badge-teal">📖 {item.pagesRead} עמ׳</span>
              )}
            </div>
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
              onClick={() => setShowComments(v => !v)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors ${
                showComments ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              }`}
            >
              <MessageCircle size={15} strokeWidth={1.5} />
              {commentCount > 0 && <span className="text-xs font-medium">{commentCount}</span>}
            </button>
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
                    <div key={c.id} className="flex items-start gap-2.5">
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
  );
};

export default FeedItemCard;
