import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import CreatePostDialog from "@/components/CreatePostDialog";

type Category = 'review' | 'discussion' | 'question' | 'recommendation';

interface PostSummary {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  contentPreview: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  category: Category;
}

const CATEGORY_META: Record<Category, { emoji: string; label: string; color: string; bg: string }> = {
  review:         { emoji: '📖', label: 'ביקורת',  color: 'hsl(188 60% 30%)',           bg: 'hsl(188 60% 92%)' },
  discussion:     { emoji: '💬', label: 'דיון',    color: 'hsl(126 15% 28%)',           bg: 'hsl(126 15% 91%)' },
  recommendation: { emoji: '✨', label: 'המלצה',   color: 'hsl(28 71% 40%)',            bg: 'hsl(28 71% 92%)' },
  question:       { emoji: '❓', label: 'שאלה',    color: 'hsl(260 40% 40%)',           bg: 'hsl(260 40% 93%)' },
};

const PROMPT_CATS: { value: Category; emoji: string; label: string }[] = [
  { value: 'review',         emoji: '📖', label: 'ביקורת' },
  { value: 'discussion',     emoji: '💬', label: 'דיון' },
  { value: 'recommendation', emoji: '✨', label: 'המלצה' },
  { value: 'question',       emoji: '❓', label: 'שאלה' },
];

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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `לפני ${m || 1} דק׳`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שע׳`;
  const d = Math.floor(h / 24);
  return `לפני ${d} יום${d > 1 ? 'ות' : ''}`;
}

const PostCard = ({
  post,
  onClick,
  onAuthorClick,
}: {
  post: PostSummary;
  onClick: () => void;
  onAuthorClick: () => void;
}) => {
  const cat = CATEGORY_META[post.category] ?? CATEGORY_META.discussion;
  const initial = post.displayName.charAt(0);
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-2xl text-right hover:bg-accent/30 active:scale-[0.99] transition-all duration-150 overflow-hidden"
      style={{ border: '1px solid hsl(44 15% 80%)', boxShadow: '0 1px 4px hsl(44 20% 70% / 0.25)' }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid hsl(44 12% 76% / 0.6)' }}>
        <div
          onClick={e => { e.stopPropagation(); onAuthorClick(); }}
          className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-75 transition-opacity"
          style={{ background: AVATAR_COLORS[initial] ?? 'hsl(126 15% 28%)' }}
        >
          <span className="text-[11px] font-bold text-white">{initial}</span>
        </div>
        <span
          onClick={e => { e.stopPropagation(); onAuthorClick(); }}
          className="text-xs font-semibold hover:text-primary transition-colors cursor-pointer"
        >{post.displayName}</span>

        {/* Category badge */}
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5"
          style={{ background: cat.bg, color: cat.color }}
        >
          {cat.emoji} {cat.label}
        </span>

        {/* Hot badge */}
        {(post.likeCount + post.commentCount) >= 3 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'hsl(22 90% 55% / 0.15)', color: 'hsl(22 90% 42%)' }}>
            🔥 חם
          </span>
        )}

        <span className="text-xs text-muted-foreground mr-auto">{timeAgo(post.createdAt)}</span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="font-serif font-bold text-base mb-1.5 leading-snug">{post.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{post.contentPreview}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border/40">
        {post.likeCount > 0 ? (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(0 60% 50%)' }}>
            <Heart size={12} strokeWidth={2} fill="currentColor" /> {post.likeCount}
          </span>
        ) : null}
        {post.commentCount > 0 ? (
          <span className="flex items-center gap-1 text-xs text-teal-700">
            <MessageCircle size={12} strokeWidth={2} /> {post.commentCount}
          </span>
        ) : null}
        {post.likeCount === 0 && post.commentCount === 0 && (
          <span className="text-xs text-muted-foreground">היה ראשון להגיב ✍️</span>
        )}
      </div>
    </button>
  );
};

type Filter = 'all' | Category;

const FILTERS: { value: Filter; emoji: string; label: string }[] = [
  { value: 'all',            emoji: '📚', label: 'הכל' },
  { value: 'discussion',     emoji: '💬', label: 'דיון' },
  { value: 'review',         emoji: '📖', label: 'ביקורת' },
  { value: 'recommendation', emoji: '✨', label: 'המלצה' },
  { value: 'question',       emoji: '❓', label: 'שאלה' },
];

const PostsFeed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<Category>('discussion');
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("id, user_id, display_name, title, content, created_at, category")
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const postIds = (data as any[]).map((p) => p.id);

    const [{ data: allLikes }, { data: allComments }] = await Promise.all([
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").in("post_id", postIds),
    ]);

    const likeMap: Record<string, number> = {};
    const commentMap: Record<string, number> = {};
    (allLikes || []).forEach((l: any) => { likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1; });
    (allComments || []).forEach((c: any) => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1; });

    const postsWithCounts: PostSummary[] = (data as any[]).map((p) => ({
      id: p.id,
      userId: p.user_id,
      displayName: p.display_name || "קורא",
      title: p.title,
      contentPreview: p.content.length > 150 ? p.content.slice(0, 150) + "…" : p.content,
      createdAt: p.created_at,
      likeCount: likeMap[p.id] || 0,
      commentCount: commentMap[p.id] || 0,
      category: (p.category ?? 'discussion') as Category,
    }));

    setPosts(postsWithCounts);
    setLoading(false);
  };

  const openCreate = (cat: Category) => {
    setInitialCategory(cat);
    setCreateOpen(true);
  };

  const filteredPosts = activeFilter === 'all' ? posts : posts.filter(p => p.category === activeFilter);

  return (
    <div className="min-h-screen pb-28">
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md pr-5 pl-16 pt-3 pb-2.5"
        style={{
          background: 'linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)',
          borderBottom: '2px solid hsl(126 15% 28% / 0.20)',
        }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <span style={{ display: 'block', width: '3px', height: '30px', background: 'hsl(126 15% 28%)', borderRadius: '2px', flexShrink: 0 }} />
            <div>
              <h1 className="font-display text-[1.75rem] tracking-[0.14em] leading-none">AMUD</h1>
              <p className="font-quote text-[10px] text-muted-foreground mt-0.5">פורום הקוראים</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category filter tabs ── */}
      <div className="sticky top-[68px] z-20 px-4 py-2 overflow-x-auto"
        style={{ background: 'linear-gradient(to bottom, hsl(44 32% 88% / 0.97), hsl(44 27% 84% / 0.95))' }}>
        <div className="flex gap-2 max-w-md mx-auto">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={
                activeFilter === f.value
                  ? { background: 'hsl(126 15% 28%)', color: 'hsl(44 30% 93%)' }
                  : { background: 'hsl(44 15% 84%)', color: 'hsl(210 8% 40%)' }
              }
            >
              <span>{f.emoji}</span> {f.label}
              {f.value !== 'all' && posts.filter(p => p.category === f.value).length > 0 && (
                <span
                  className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                  style={
                    activeFilter === f.value
                      ? { background: 'hsl(44 30% 93% / 0.3)', color: 'hsl(44 30% 93%)' }
                      : { background: 'hsl(126 15% 28% / 0.12)', color: 'hsl(126 15% 28%)' }
                  }
                >
                  {posts.filter(p => p.category === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto space-y-3">

        {/* ── "What's on your mind" prompt card ── */}
        <div
          className="rounded-2xl bg-card p-4 space-y-3"
          style={{ border: '1px solid hsl(44 15% 80%)', boxShadow: '0 1px 4px hsl(44 20% 70% / 0.25)' }}
        >
          <p className="text-sm font-semibold text-center text-foreground">
            📚 מה על הלב הספרותי שלך?
          </p>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            שתף ביקורת, פתח דיון, המלץ על ספר, או שאל את הקהילה
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PROMPT_CATS.map(cat => (
              <button
                key={cat.value}
                onClick={() => openCreate(cat.value)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                style={{ background: 'hsl(44 20% 91%)', color: 'hsl(126 15% 28%)' }}
              >
                <span className="text-xl leading-none">{cat.emoji}</span>
                <span className="text-[11px] font-semibold">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Post list ── */}
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
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {posts.length === 0 ? (
              <>
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm font-semibold">הפורום עדיין ריק</p>
                <p className="text-xs mt-1">היה ראשון לפתוח דיון!</p>
              </>
            ) : (
              <>
                <p className="text-3xl mb-3">{FILTERS.find(f => f.value === activeFilter)?.emoji}</p>
                <p className="text-sm font-semibold">אין פוסטים בקטגוריה זו עדיין</p>
                <button
                  onClick={() => openCreate(activeFilter === 'all' ? 'discussion' : activeFilter as Category)}
                  className="mt-3 text-xs font-semibold text-primary hover:underline"
                >
                  פתח ראשון! ✍️
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {filteredPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => navigate(`/post/${post.id}`)}
                onAuthorClick={() => navigate(`/user/${post.userId}?name=${encodeURIComponent(post.displayName)}`)}
              />
            ))}
          </>
        )}
      </div>

      <CreatePostDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchPosts}
        initialCategory={initialCategory}
      />
    </div>
  );
};

export default PostsFeed;
