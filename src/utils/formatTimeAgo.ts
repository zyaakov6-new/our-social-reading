import type { Translations } from "@/i18n/he";

export function formatTimeAgo(
  iso: string,
  t: Pick<Translations["common"], "now" | "minutesAgo" | "hoursAgo" | "daysAgo">
): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t.now;
  if (m < 60) return t.minutesAgo(m);
  const h = Math.floor(m / 60);
  if (h < 24) return t.hoursAgo(h);
  const d = Math.floor(h / 24);
  return t.daysAgo(d);
}
