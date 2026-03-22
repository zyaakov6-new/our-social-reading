import { useMemo } from "react";
import { useReadingSessions } from "./useReadingSessions";

/** Returns the current consecutive-day reading streak for the logged-in user. */
export const useStreak = () => {
  const { sessions, loading } = useReadingSessions();

  const streak = useMemo(() => {
    const mine = sessions.filter(s => s.isMe);
    if (mine.length === 0) return 0;

    const toLocalDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    const uniqueDates = [
      ...new Set(mine.map(s => s.sessionDate.substring(0, 10))),
    ].sort().reverse();

    const now = new Date();
    const today = toLocalDate(now);
    const yesterday = toLocalDate(new Date(now.getTime() - 86_400_000));

    if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday))
      return 0;

    let count = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = toLocalDate(
        new Date(now.getTime() - i * 86_400_000)
      );
      if (uniqueDates.includes(expected)) count++;
      else break;
    }
    return count;
  }, [sessions]);

  return { streak, loading };
};
