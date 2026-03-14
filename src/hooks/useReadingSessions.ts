import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReadingSession {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
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
}

export const useReadingSessions = () => {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("reading_sessions")
        .select(`
          id,
          minutes_read,
          pages_read,
          session_date,
          created_at,
          books (
            id,
            title,
            author
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const userName = profile?.display_name || user.email?.split("@")[0] || "קורא";

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

        return {
          id: session.id,
          bookId: session.books?.id || "",
          bookTitle: session.books?.title || "ספר לא ידוע",
          bookAuthor: session.books?.author,
          userName,
          minutesRead: session.minutes_read,
          pagesRead: session.pages_read,
          sessionDate: session.session_date || session.created_at,
          timestamp,
          likes: 0,
          comments: 0,
        };
      });

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
