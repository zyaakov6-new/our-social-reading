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
      // Step 1: Get challenge IDs where user participates
      const { data: participantRows } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .eq("user_id", user.id);

      const participantChallengeIds = (participantRows || []).map((r: any) => r.challenge_id);

      const orParts = [`creator_id.eq.${user.id}`, `is_public.eq.true`];
      if (participantChallengeIds.length > 0) {
        orParts.push(`id.in.(${participantChallengeIds.join(",")})`);
      }

      // Step 2: Get all relevant challenges
      const { data: challengeData } = await supabase
        .from("challenges")
        .select("*")
        .or(orParts.join(","))
        .order("created_at", { ascending: false });

      if (!challengeData || challengeData.length === 0) {
        setChallenges([]);
        setLoading(false);
        return;
      }

      const challengeIds = challengeData.map((c: any) => c.id);

      // Step 3: Get ALL participants for ALL challenges in ONE query
      const { data: allParticipantRows } = await supabase
        .from("challenge_participants")
        .select("challenge_id, user_id")
        .in("challenge_id", challengeIds);

      // Build per-challenge participant map
      const challengeParticipantsMap: Record<string, string[]> = {};
      challengeData.forEach((c: any) => {
        challengeParticipantsMap[c.id] = [c.creator_id];
      });
      (allParticipantRows || []).forEach((row: any) => {
        const existing = challengeParticipantsMap[row.challenge_id] || [];
        if (!existing.includes(row.user_id)) {
          challengeParticipantsMap[row.challenge_id] = [...existing, row.user_id];
        }
      });

      // Collect all unique user IDs across all challenges
      const allUserIds = [
        ...new Set(Object.values(challengeParticipantsMap).flat()),
      ];

      // Step 4: Get ALL profiles in ONE query
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", allUserIds);

      const profileMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => {
        profileMap[p.user_id] = p.display_name || "קורא";
      });

      // Step 5: Get ALL reading sessions for all participants in the union date range in ONE query
      const minStart = challengeData.reduce(
        (min: string, c: any) => (c.start_date < min ? c.start_date : min),
        challengeData[0].start_date
      );
      const maxEnd = challengeData.reduce(
        (max: string, c: any) => (c.end_date > max ? c.end_date : max),
        challengeData[0].end_date
      );

      const { data: allSessions } = await supabase
        .from("reading_sessions")
        .select("user_id, book_id, minutes_read, session_date")
        .in("user_id", allUserIds)
        .gte("session_date", minStart)
        .lte("session_date", maxEnd);

      // Step 6: Compute everything in JS — no more per-participant queries
      const result: Challenge[] = challengeData.map((c: any) => {
        const participantIds = challengeParticipantsMap[c.id] || [c.creator_id];

        // Sessions relevant to this challenge's date range
        const challengeSessions = (allSessions || []).filter(
          (s: any) =>
            participantIds.includes(s.user_id) &&
            s.session_date >= c.start_date &&
            s.session_date <= c.end_date
        );

        const participantList: ChallengeParticipant[] = participantIds.map((uid: string) => {
          const userSessions = challengeSessions.filter((s: any) => s.user_id === uid);
          let progress = 0;
          if (c.goal_type === "minutes") {
            progress = userSessions.reduce((sum: number, s: any) => sum + (s.minutes_read || 0), 0);
          } else {
            progress = new Set(userSessions.map((s: any) => s.book_id)).size;
          }
          const fallbackName =
            uid === user.id
              ? user.user_metadata?.full_name || user.email?.split("@")[0] || "קורא"
              : "קורא";
          return {
            userId: uid,
            displayName: profileMap[uid] || fallbackName,
            progress,
          };
        });

        participantList.sort((a, b) => b.progress - a.progress);

        const myProgress = participantList.find((p) => p.userId === user.id)?.progress ?? 0;
        const myRankIndex = participantList.findIndex((p) => p.userId === user.id);
        const myRank = myRankIndex >= 0 ? myRankIndex + 1 : participantList.length;
        const isParticipant =
          c.creator_id === user.id ||
          (allParticipantRows || []).some(
            (p: any) => p.challenge_id === c.id && p.user_id === user.id
          );

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
      });

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
