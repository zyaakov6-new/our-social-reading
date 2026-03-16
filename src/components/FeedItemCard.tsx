import { useEffect, useState, useRef } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { ReadingSession } from "@/hooks/useReadingSessions";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

const FeedItemCard = ({ item }: { item: ReadingSession }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    fetchLikes();
  }, [item.id]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [showComments]);

  const fetchLikes = async () => {
    try {
      const [{ data: likes }, { data: { user } }] = await Promise.all([
        supabase.from("session_likes").select("user_id").eq("session_id", item.id),
        supabase.auth.getUser(),
      ]);
      if (likes) {
        setLikeCount(likes.length);
        setLiked(likes.some((l: any) => l.user_id === user?.id));
      }
    } catch {}
  };

  const fetchComments = async () => {
    try {
      const { data } = await supabase
        .from("session_comments")
        .select("id, user_id, display_name, content, created_at")
        .eq("session_id", item.id)
        .order("created_at", { ascending: true });
      if (data) setComments(data as Comment[]);
    } catch {}
  };

  const toggleLike = async () => {
    if (!currentUserId) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    try {
      if (wasLiked) {
        await supabase
          .from("session_likes")
          .delete()
          .eq("session_id", item.id)
          .eq("user_id", currentUserId);
      } else {
        await supabase
          .from("session_likes")
          .insert({ session_id: item.id, user_id: currentUserId });
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !currentUserId || submitting) return;
    setSubmitting(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", currentUserId)
        .maybeSingle();

      const displayName = (profile as any)?.display_name || "קורא";
      const { data } = await supabase
        .from("session_comments")
        .insert({ session_id: item.id, user_id: currentUserId, display_name: displayName, content: commentText.trim() })
        .select()
        .single();

      if (data) {
        setComments(prev => [...prev, data as Comment]);
        setCommentText("");
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      {/* Activity */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-accent flex items-center justify-center">
            <span className="font-semibold text-sm text-accent-foreground">
              {item.userName.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">{item.userName}</span>
              {" "}קרא/ה{" "}
              <span className="font-semibold text-primary">{item.minutesRead} דקות</span>
              {item.pagesRead > 0 && (
                <span className="text-muted-foreground"> · {item.pagesRead} עמ׳</span>
              )}
              {" "}של{" "}
              <span className="font-semibold">"{item.bookTitle}"</span>
            </p>
            <span className="text-xs text-muted-foreground mt-0.5 block">{item.timestamp}</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 pb-3 border-t border-border/40 pt-2.5">
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
          {comments.length > 0 && <span className="text-xs font-medium">{comments.length}</span>}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border/40 bg-background/40">
          {comments.length > 0 && (
            <div className="px-4 pt-3 pb-2 space-y-2.5">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div className="h-6 w-6 flex-shrink-0 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-accent-foreground">
                      {c.display_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <span className="font-semibold text-xs">{c.display_name} </span>
                    <span className="text-xs text-foreground/80">{c.content}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">היה ראשון להגיב</p>
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
