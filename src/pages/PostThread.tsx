import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGateModal from "@/components/AuthGateModal";

interface Post {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  content: string;
  createdAt: string;
}

interface Comment {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
}

const PostThread = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateAction, setGateAction] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openGate = (action: string) => { setGateAction(action); setGateOpen(true); };

  useEffect(() => {
    if (!postId) return;
    fetchAll();
  }, [postId]);

  const fetchAll = async () => {
    setLoading(true);
    const [
      { data: postData },
      { data: commentsData },
      { data: likesData },
      { data: { user } },
    ] = await Promise.all([
      supabase.from("posts").select("id, user_id, display_name, title, content, created_at").eq("id", postId!).single(),
      supabase.from("post_comments").select("id, user_id, display_name, content, created_at").eq("post_id", postId!).order("created_at", { ascending: true }),
      supabase.from("post_likes").select("user_id").eq("post_id", postId!),
      supabase.auth.getUser(),
    ]);

    if (postData) {
      setPost({
        id: (postData as any).id,
        userId: (postData as any).user_id,
        displayName: (postData as any).display_name || "קורא",
        title: (postData as any).title,
        content: (postData as any).content,
        createdAt: (postData as any).created_at,
      });
    }

    if (commentsData) {
      setComments((commentsData as any[]).map(c => ({
        id: c.id,
        userId: c.user_id,
        displayName: c.display_name || "קורא",
        content: c.content,
        createdAt: c.created_at,
      })));
    }

    if (likesData) {
      setLikeCount(likesData.length);
      setLiked(likesData.some((l: any) => l.user_id === user?.id));
    }

    if (user) setCurrentUserId(user.id);
    setLoading(false);
  };

  const toggleLike = async () => {
    if (!currentUserId) { openGate("לאהוב פוסטים"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    try {
      if (wasLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId!).eq("user_id", currentUserId);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId!, user_id: currentUserId });
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
        .from("post_comments")
        .insert({ post_id: postId!, user_id: currentUserId, display_name: displayName, content: commentText.trim() })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setComments(prev => [...prev, {
          id: (data as any).id,
          userId: (data as any).user_id,
          displayName: (data as any).display_name,
          content: (data as any).content,
          createdAt: (data as any).created_at,
        }]);
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
      .from("post_comments")
      .delete()
      .eq("id", commentId);
    if (error) { toast.error("שגיאה במחיקת תגובה"); return; }
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-28">
        <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border/40">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-48 rounded" />
        </div>
        <div className="px-4 pt-6 max-w-md mx-auto space-y-3">
          <Skeleton className="h-7 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground text-sm">פוסט לא נמצא</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">חזור</button>
      </div>
    );
  }

  return (
    <>
    <AuthGateModal open={gateOpen} onClose={() => setGateOpen(false)} action={gateAction} />
    <div className="min-h-screen pb-28 bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border/40">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowRight size={20} strokeWidth={1.5} />
        </button>
        <h1 className="font-semibold text-base truncate flex-1">{post.title}</h1>
      </div>

      <div className="px-4 pt-5 max-w-md mx-auto space-y-5">
        {/* Post body */}
        <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(`/user/${post.userId}?name=${encodeURIComponent(post.displayName)}`)}
              className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <span className="text-xs font-semibold text-accent-foreground">{post.displayName.charAt(0)}</span>
            </button>
            <div>
              <button
                onClick={() => navigate(`/user/${post.userId}?name=${encodeURIComponent(post.displayName)}`)}
                className="text-sm font-semibold hover:text-primary transition-colors block"
              >
                {post.displayName}
              </button>
              <p className="text-[11px] text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

          <div className="pt-2 border-t border-border/40">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors ${
                liked ? "text-red-500 bg-red-50" : "text-muted-foreground hover:text-red-400 hover:bg-red-50/60"
              }`}
            >
              <Heart size={15} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} />
              {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
              <span className="text-xs">אהבתי</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <h3 className="section-heading">
            תגובות{comments.length > 0 ? ` (${comments.length})` : ""}
          </h3>

          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">היה ראשון להגיב</p>
          ) : (
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="bg-card border border-border/50 rounded-xl px-4 py-3 group">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => navigate(`/user/${c.userId}?name=${encodeURIComponent(c.displayName)}`)}
                      className="h-7 w-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <span className="text-[10px] font-semibold text-accent-foreground">{c.displayName.charAt(0)}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <button
                          onClick={() => navigate(`/user/${c.userId}?name=${encodeURIComponent(c.displayName)}`)}
                          className="text-xs font-semibold hover:text-primary transition-colors"
                        >
                          {c.displayName}
                        </button>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 mt-0.5">{c.content}</p>
                    </div>
                    {c.userId === currentUserId && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded text-muted-foreground/50 hover:text-red-400 transition-all"
                        title="מחק תגובה"
                      >
                        <Trash2 size={12} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              ref={inputRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
              onFocus={() => { if (!currentUserId) { openGate("להגיב"); (inputRef.current as HTMLInputElement | null)?.blur(); } }}
              placeholder={currentUserId ? "הוסף תגובה..." : "התחבר כדי להגיב..."}
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
      </div>
    </div>
    </>
  );
};

export default PostThread;
