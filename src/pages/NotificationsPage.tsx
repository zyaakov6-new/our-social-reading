import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Heart, UserPlus, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTimeAgo } from "@/utils/formatTimeAgo";

type NotifType = "comment" | "like" | "friend_request";

interface Notification {
  id: string;
  type: NotifType;
  text: string;
  createdAt: string;
  postId?: string;
  friendshipId?: string;
  requesterId?: string;
}

const ICON_MAP: Record<NotifType, React.ElementType> = {
  comment: MessageCircle,
  like: Heart,
  friend_request: UserPlus,
};

const ICON_COLOR: Record<NotifType, string> = {
  comment: "hsl(188 60% 35%)",
  like: "hsl(0 60% 50%)",
  friend_request: "hsl(126 15% 28%)",
};

const ICON_BG: Record<NotifType, string> = {
  comment: "hsl(188 60% 91%)",
  like: "hsl(0 60% 95%)",
  friend_request: "hsl(126 15% 91%)",
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const lastSeen = localStorage.getItem("notifications_last_seen");
  const lastSeenTs = lastSeen ? parseInt(lastSeen, 10) : 0;

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark as seen when page mounts (after fetch, to count correctly first)
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("notifications_last_seen", String(Date.now()));
    }
  }, [loading]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const [commentNotifs, likeNotifs, friendNotifs] = await Promise.all([
        fetchCommentNotifs(user.id),
        fetchLikeNotifs(user.id),
        fetchFriendRequestNotifs(user.id),
      ]);

      const all = [...commentNotifs, ...likeNotifs, ...friendNotifs].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(all);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentNotifs = async (userId: string): Promise<Notification[]> => {
    // Get comments on MY posts, by other users — filter at DB level via inner join
    const { data, error } = await supabase
      .from("post_comments")
      .select("id, display_name, content, created_at, post_id, user_id, posts!inner(id, title, user_id)")
      .neq("user_id", userId)
      .eq("posts.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];

    return (data as any[])
      .filter((row) => row.posts?.user_id === userId)
      .map((row) => ({
        id: `comment-${row.id}`,
        type: "comment" as NotifType,
        text: t.notifications.commentedOn(row.display_name || t.notifications.someone, row.posts?.title ?? ""),
        createdAt: row.created_at,
        postId: row.post_id,
      }));
  };

  const fetchLikeNotifs = async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from("post_likes")
      .select("id, user_id, created_at, post_id, posts!inner(id, title, user_id)")
      .eq("posts.user_id", userId)
      .neq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];

    const filtered = (data as any[]).filter(
      (row) => row.posts?.user_id === userId && row.user_id !== userId
    );

    if (filtered.length === 0) return [];

    const likerIds = [...new Set(filtered.map((r) => r.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", likerIds);

    const profileMap: Record<string, string> = {};
    if (profilesData) {
      for (const p of profilesData as any[]) {
        profileMap[p.user_id] = p.display_name || "מישהו";
      }
    }

    return filtered.map((row) => ({
      id: `like-${row.id}`,
      type: "like" as NotifType,
      text: t.notifications.likedPost(profileMap[row.user_id] ?? t.notifications.someone, row.posts?.title ?? ""),
      createdAt: row.created_at,
      postId: row.post_id,
    }));
  };

  const fetchFriendRequestNotifs = async (
    userId: string
  ): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from("friendships")
      .select("id, requester_id, created_at")
      .eq("addressee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const requesterIds = (data as any[]).map((r) => r.requester_id);
    if (requesterIds.length === 0) return [];

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", requesterIds);

    const profileMap: Record<string, string> = {};
    if (profilesData) {
      for (const p of profilesData as any[]) {
        profileMap[p.user_id] = p.display_name || "מישהו";
      }
    }

    return (data as any[]).map((row) => ({
      id: `friend-${row.id}`,
      type: "friend_request" as NotifType,
      text: t.notifications.friendRequest(profileMap[row.requester_id] ?? t.notifications.someone),
      createdAt: row.created_at,
      friendshipId: row.id,
      requesterId: row.requester_id,
    }));
  };

  const handleFriendAction = async (
    friendshipId: string,
    action: "accepted" | "rejected"
  ) => {
    setProcessingId(friendshipId);
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: action })
        .eq("id", friendshipId);
      if (error) throw error;
      toast.success(action === "accepted" ? t.notifications.accepted : t.notifications.rejected);
      // Remove from list
      setNotifications((prev) =>
        prev.filter((n) => n.friendshipId !== friendshipId)
      );
    } catch (e: any) {
      toast.error(e?.message || "שגיאה");
    } finally {
      setProcessingId(null);
    }
  };

  const unreadCount = notifications.filter(
    (n) => new Date(n.createdAt).getTime() > lastSeenTs
  ).length;

  return (
    <div className="min-h-screen pb-28 bg-background" dir={dir}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md pr-5 pl-16 pt-3 pb-2.5"
        style={{
          background:
            "linear-gradient(to bottom, hsl(44 32% 88% / 0.97) 0%, hsl(44 27% 84% / 0.97) 100%)",
          borderBottom: "2px solid hsl(126 15% 28% / 0.20)",
        }}
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
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
            <div>
              <h1 className="font-display text-[1.75rem] tracking-[0.14em] leading-none">
                AMUD
              </h1>
              <p className="font-quote text-[10px] text-muted-foreground mt-0.5">
                {t.notifications.subheader}
              </p>
            </div>
          </div>
          {unreadCount > 0 && !loading && (
            <span
              className="text-xs font-bold text-white rounded-full px-2 py-0.5"
              style={{ background: "hsl(0 72% 51%)" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-md mx-auto space-y-2">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-4 flex items-center gap-3"
                style={{ border: "1px solid hsl(44 15% 80%)" }}
              >
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Bell size={40} className="text-muted-foreground/40" strokeWidth={1} />
            <p className="text-sm font-semibold text-muted-foreground">
              {t.notifications.empty}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {t.notifications.emptySub}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = ICON_MAP[notif.type];
            const iconColor = ICON_COLOR[notif.type];
            const iconBg = ICON_BG[notif.type];
            const isNew = new Date(notif.createdAt).getTime() > lastSeenTs;

            return (
              <div
                key={notif.id}
                className="bg-card rounded-xl p-4 flex items-start gap-3 transition-colors"
                style={{
                  border: `1px solid ${isNew ? "hsl(220 80% 70% / 0.5)" : "hsl(44 15% 80%)"}`,
                  background: isNew
                    ? "hsl(220 80% 97%)"
                    : undefined,
                }}
              >
                {/* Icon */}
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: iconBg }}
                >
                  <Icon size={18} strokeWidth={1.5} style={{ color: iconColor }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-sm leading-snug flex-1"
                      style={{ fontWeight: isNew ? 600 : 400 }}
                    >
                      {notif.text}
                    </p>
                    {isNew && (
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: "hsl(220 80% 55%)" }}
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {formatTimeAgo(notif.createdAt, t.common)}
                  </p>

                  {/* Post link */}
                  {notif.postId && (
                    <button
                      onClick={() => navigate(`/post/${notif.postId}`)}
                      className="text-xs font-medium mt-1 transition-colors"
                      style={{ color: "hsl(188 60% 35%)" }}
                    >
                      {t.notifications.viewPost}
                    </button>
                  )}

                  {/* Friend request actions */}
                  {notif.type === "friend_request" && notif.friendshipId && (
                    <div className="flex gap-2 mt-2">
                      <button
                        disabled={processingId === notif.friendshipId}
                        onClick={() =>
                          handleFriendAction(notif.friendshipId!, "accepted")
                        }
                        className="flex-1 rounded-lg py-1.5 text-xs font-bold text-white transition-opacity disabled:opacity-60"
                        style={{ background: "hsl(126 15% 28%)" }}
                      >
                        {t.notifications.accept}
                      </button>
                      <button
                        disabled={processingId === notif.friendshipId}
                        onClick={() =>
                          handleFriendAction(notif.friendshipId!, "rejected")
                        }
                        className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
                        style={{
                          background: "hsl(44 20% 91%)",
                          color: "hsl(210 11% 30%)",
                        }}
                      >
                        {t.notifications.reject}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
