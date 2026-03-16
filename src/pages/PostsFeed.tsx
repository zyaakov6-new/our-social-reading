import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, PenSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import CreatePostDialog from "@/components/CreatePostDialog";

interface PostSummary {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  contentPreview: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

const PostsFeed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("id, user_id, display_name, title, content, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const postsWithCounts = await Promise.all(
      data.map(async (p: any) => {
        const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
          supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", p.id),
          supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("post_id", p.id),
        ]);
        return {
          id: p.id,
          userId: p.user_id,
          displayName: p.display_name || "קורא",
          title: p.title,
          contentPreview: p.content.length > 120 ? p.content.slice(0, 120) + "…" : p.content,
          createdAt: p.created_at,
          likeCount: likeCount ?? 0,
          commentCount: commentCount ?? 0,
        };
      })
    );

    setPosts(postsWithCounts);
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <span className="amud-pillar h-9" />
            <div>
              <h1 className="font-display text-3xl tracking-[0.18em] leading-none">AMUD</h1>
              <p className="font-quote text-[11px] text-muted-foreground mt-0.5" style={{ fontStyle: 'italic' }}>
                פורום הקוראים
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl btn-cta text-sm font-semibold"
          >
            <PenSquare size={15} strokeWidth={1.5} />
            פוסט חדש
          </button>
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto space-y-3">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-3 w-16 rounded mr-auto" />
                </div>
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
                <div className="flex gap-3 pt-1 border-t border-border/40">
                  <Skeleton className="h-5 w-10 rounded" />
                  <Skeleton className="h-5 w-10 rounded" />
                </div>
              </div>
            ))}
          </>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-sm font-semibold">אין עדיין פוסטים</p>
            <p className="text-xs text-muted-foreground">היה ראשון לפתוח דיון</p>
          </div>
        ) : (
          posts.map(post => (
            <button
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              className="w-full bg-card border border-border/50 rounded-xl p-4 text-right hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-semibold text-accent-foreground">
                    {post.displayName.charAt(0)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{post.displayName}</span>
                <span className="text-xs text-muted-foreground mr-auto">
                  {new Date(post.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p className="font-semibold text-sm mb-1.5">{post.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{post.contentPreview}</p>
              <div className="flex items-center gap-3 pt-2.5 mt-2.5 border-t border-border/40">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart size={13} strokeWidth={1.5} />
                  {post.likeCount > 0 && post.likeCount}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle size={13} strokeWidth={1.5} />
                  {post.commentCount > 0 && post.commentCount}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      <CreatePostDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchPosts}
      />
    </div>
  );
};

export default PostsFeed;
