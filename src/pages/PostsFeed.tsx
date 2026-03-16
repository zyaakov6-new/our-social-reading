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
      <div
        className="sticky top-0 z-30 backdrop-blur-md px-5 pt-5 pb-4"
        style={{
          background: 'linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)',
          borderBottom: '2px solid hsl(188 100% 27% / 0.22)',
        }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <span style={{ display: 'block', width: '3px', height: '44px', background: 'hsl(188 100% 27%)', borderRadius: '2px', flexShrink: 0 }} />
            <div>
              <h1 className="font-display text-4xl tracking-[0.18em] leading-none">AMUD</h1>
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
              className="w-full bg-card rounded-2xl text-right hover:bg-accent/30 transition-all duration-200 card-shadow animate-fade-slide-up overflow-hidden"
              style={{ border: '1px solid hsl(44 15% 80%)' }}
            >
              {/* Teal header band for forum posts */}
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: 'hsl(188 100% 27% / 0.07)', borderBottom: '1px solid hsl(188 100% 27% / 0.12)' }}>
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: AVATAR_COLORS[post.displayName.charAt(0)] ?? 'hsl(126 15% 28%)' }}
                >
                  <span className="text-[11px] font-bold text-primary-foreground">
                    {post.displayName.charAt(0)}
                  </span>
                </div>
                <span className="text-xs font-semibold text-foreground">{post.displayName}</span>
                <span className="text-xs text-muted-foreground mr-auto">
                  {new Date(post.createdAt).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                </span>
              </div>

              {/* Post body */}
              <div className="px-4 py-3">
                <p className="font-bold text-base mb-1.5 leading-snug">{post.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{post.contentPreview}</p>
              </div>

              {/* Engagement footer */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/40">
                {post.likeCount > 0 && (
                  <span className="badge-green" style={{ background: 'hsl(0 60% 55% / 0.10)', color: 'hsl(0 60% 40%)', borderColor: 'hsl(0 60% 55% / 0.18)' }}>
                    <Heart size={11} strokeWidth={2} /> {post.likeCount}
                  </span>
                )}
                {post.commentCount > 0 && (
                  <span className="badge-teal">
                    <MessageCircle size={11} strokeWidth={2} /> {post.commentCount}
                  </span>
                )}
                {post.likeCount === 0 && post.commentCount === 0 && (
                  <span className="text-xs text-muted-foreground">היה ראשון להגיב</span>
                )}
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
