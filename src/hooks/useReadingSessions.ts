import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  coverUrl?: string;
  userName: string;
  avatarUrl?: string;
  minutesRead: number;
  pagesRead: number;
  /** ISO date string (YYYY-MM-DD) used for streaks/heatmap */
  sessionDate: string;
  /** Human-friendly relative time (e.g. "לפני 3 דקות") */
  timestamp: string;
  likes: number;
  comments: number;
  /** Whether this session belongs to the current logged-in user */
  isMe: boolean;
}

// Module-level stale-while-revalidate cache
interface SessionsCache {
  sessions: ReadingSession[];
  userId: string;
  time: number;
}
let _sessionsCache: SessionsCache | null = null;
const SESSIONS_TTL = 2 * 60 * 1000; // 2 minutes

export const useReadingSessions = () => {
  const { user } = useAuth();

  const isCacheValid = !!(
    _sessionsCache &&
    _sessionsCache.userId === user?.id &&
    Date.now() - _sessionsCache.time < SESSIONS_TTL
  );

  const [sessions, setSessions] = useState<ReadingSession[]>(
    _sessionsCache?.userId === user?.id ? (_sessionsCache?.sessions ?? []) : []
  );
  const [loading, setLoading] = useState(!isCacheValid);

  const fetchSessions = async () => {
    if (!user) return;
    try {
      // Get accepted friend IDs
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = (friendships || []).map((f: any) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      const allIds = [user.id, ...friendIds];

      // Get profiles for all users in one round-trip
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", allIds);

      const profileMap: Record<string, { displayName: string; avatarUrl?: string }> = {};
      (profilesData || []).forEach((p: any) => {
        profileMap[p.user_id] = {
          displayName: p.display_name || "קורא",
          avatarUrl: p.avatar_url ?? undefined,
        };
      });

      // Fallback name for current user when no profile row exists
      const myFallbackName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "קורא";

      if (!profileMap[user.id]) {
        profileMap[user.id] = { displayName: myFallbackName };
      }

      // Fetch reading sessions for current user + all friends
      const { data, error } = await supabase
        .from("reading_sessions")
        .select(`
          id,
          user_id,
          minutes_read,
          pages_read,
          session_date,
          created_at,
          books (
            id,
            title,
            author,
            cover_url
          )
        `)
        .in("user_id", allIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const mappedSessions: ReadingSession[] = (data || []).map((session: any) => {
        const now = new Date();
        const sessionDate = new Date(session.created_at);
        const diffMs = now.getTime() - sessionDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timestamp = "";
        if (diffMins < 1) timestamp = "עכשיו";
        else if (diffMins < 60) timestamp = `לפני ${diffMins} דקות`;
        else if (diffHours < 24) timestamp = `לפני ${diffHours} שעות`;
        else timestamp = `לפני ${diffDays} ימים`;

        const isMe = session.user_id === user.id;
        const profile = profileMap[session.user_id];
        const userName = isMe
          ? (profile?.displayName || myFallbackName)
          : (profile?.displayName || "קורא");

        return {
          id: session.id,
          userId: session.user_id,
          bookId: session.books?.id || "",
          bookTitle: session.books?.title || "ספר לא ידוע",
          bookAuthor: session.books?.author,
          coverUrl: session.books?.cover_url ?? undefined,
          userName,
          avatarUrl: profile?.avatarUrl,
          minutesRead: session.minutes_read,
          pagesRead: session.pages_read,
          sessionDate: session.session_date || session.created_at,
          timestamp,
          likes: 0,
          comments: 0,
          isMe,
        };
      });

      _sessionsCache = { sessions: mappedSessions, userId: user.id, time: Date.now() };
      setSessions(mappedSessions);
    } catch (error) {
      console.error("Error fetching reading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel("reading_sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reading_sessions",
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { sessions, loading, refetch: fetchSessions };
};
