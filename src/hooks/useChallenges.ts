import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChallengeParticipant {
  userId: string;
  displayName: string;
  progress: number; // minutes or books depending on goal_type
}

export interface Challenge {
  id: string;
  creatorId: string;
  name: string;
  goalType: "minutes" | "books";
  goalValue: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  participants: ChallengeParticipant[];
  myProgress: number;
  myRank: number;
  isParticipant: boolean;
  isPublic: boolean;
}

export const useChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get all challenges where user is participant or creator
      const { data: participantRows } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .eq("user_id", user.id);

      const participantChallengeIds = (participantRows || []).map((r: any) => r.challenge_id);

      // Fetch: created by user, OR user is participant, OR is_public=true
      const orParts = [`creator_id.eq.${user.id}`, `is_public.eq.true`];
      if (participantChallengeIds.length > 0) {
        orParts.push(`id.in.(${participantChallengeIds.join(",")})`);
      }
      const { data: challengeData } = await supabase
        .from("challenges")
        .select("*")
        .or(orParts.join(","))
        .order("created_at", { ascending: false });

      if (!challengeData) { setLoading(false); return; }

      const result: Challenge[] = await Promise.all(
        challengeData.map(async (c: any) => {
          // Get all participants for this challenge
          const { data: parts } = await supabase
            .from("challenge_participants")
            .select("user_id, joined_at")
            .eq("challenge_id", c.id);

          const allUserIds = [
            c.creator_id,
            ...((parts || []).map((p: any) => p.user_id).filter((id: string) => id !== c.creator_id)),
          ];

          // Get profiles for participants
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", allUserIds);

          const profileMap: Record<string, string> = {};
          (profiles || []).forEach((p: any) => {
            profileMap[p.user_id] = p.display_name || "קורא";
          });

          // Compute progress per participant
          const participantList: ChallengeParticipant[] = await Promise.all(
            allUserIds.map(async (uid: string) => {
              let progress = 0;
              if (c.goal_type === "minutes") {
                const { data: sessions } = await supabase
                  .from("reading_sessions")
                  .select("minutes_read")
                  .eq("user_id", uid)
                  .gte("session_date", c.start_date)
                  .lte("session_date", c.end_date);
                progress = (sessions || []).reduce((sum: number, s: any) => sum + (s.minutes_read || 0), 0);
              } else {
                // books: count distinct finished books in date range
                const { data: sessions } = await supabase
                  .from("reading_sessions")
                  .select("book_id")
                  .eq("user_id", uid)
                  .gte("session_date", c.start_date)
                  .lte("session_date", c.end_date);
                progress = new Set((sessions || []).map((s: any) => s.book_id)).size;
              }
              const fallbackName =
                uid === user.id
                  ? (user.user_metadata?.full_name || user.email?.split("@")[0] || "קורא")
                  : "קורא";
              return { userId: uid, displayName: profileMap[uid] || fallbackName, progress };
            })
          );

          // Sort by progress desc
          participantList.sort((a, b) => b.progress - a.progress);

          const myProgress = participantList.find((p) => p.userId === user.id)?.progress ?? 0;
          const myRankIndex = participantList.findIndex((p) => p.userId === user.id);
          const myRank = myRankIndex >= 0 ? myRankIndex + 1 : participantList.length;
          const isParticipant =
            c.creator_id === user.id ||
            (parts || []).some((p: any) => p.user_id === user.id);

          return {
            id: c.id,
            creatorId: c.creator_id,
            name: c.name,
            goalType: c.goal_type as "minutes" | "books",
            goalValue: c.goal_value,
            startDate: c.start_date,
            endDate: c.end_date,
            createdAt: c.created_at,
            participants: participantList,
            myProgress,
            myRank,
            isParticipant,
            isPublic: !!c.is_public,
          };
        })
      );

      setChallenges(result);
    } catch (e) {
      console.error("useChallenges error:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const createChallenge = async (name: string, goalType: "minutes" | "books", goalValue: number, endDate: string) => {
    if (!user) throw new Error("לא מחובר");
    const { data, error } = await supabase
      .from("challenges")
      .insert({
        creator_id: user.id,
        name,
        goal_type: goalType,
        goal_value: goalValue,
        start_date: new Date().toISOString().split("T")[0],
        end_date: endDate,
      })
      .select()
      .single();
    if (error) throw error;
    // Auto-join as creator
    await supabase.from("challenge_participants").insert({
      challenge_id: data.id,
      user_id: user.id,
    });
    await fetchChallenges();
    return data;
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) throw new Error("לא מחובר");
    const { error } = await supabase.from("challenge_participants").insert({
      challenge_id: challengeId,
      user_id: user.id,
    });
    if (error) throw error;
    await fetchChallenges();
  };

  const leaveChallenge = async (challengeId: string) => {
    if (!user) throw new Error("לא מחובר");
    await supabase
      .from("challenge_participants")
      .delete()
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id);
    await fetchChallenges();
  };

  return { challenges, loading, refetch: fetchChallenges, createChallenge, joinChallenge, leaveChallenge };
};
