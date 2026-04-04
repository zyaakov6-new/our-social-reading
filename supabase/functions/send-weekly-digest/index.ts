import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "AMUD <noreply@amudapp.com>";
const APP_URL = "https://www.amudapp.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    // Get all users with their emails
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    if (!authUsers?.users?.length) return new Response("no users", { status: 200 });

    // Get Pro profiles only — weekly digest is a Pro feature
    const userIds = authUsers.users.map(u => u.id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, reading_goal_minutes")
      .in("user_id", userIds)
      .eq("is_pro", true);

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]));

    // Get this week's reading sessions per user
    const { data: sessions } = await supabase
      .from("reading_sessions")
      .select("user_id, minutes_read, session_date")
      .in("user_id", userIds)
      .gte("session_date", weekAgoStr);

    // Group sessions by user
    const sessionsByUser: Record<string, { totalMinutes: number; days: Set<string> }> = {};
    for (const s of sessions ?? []) {
      if (!sessionsByUser[s.user_id]) sessionsByUser[s.user_id] = { totalMinutes: 0, days: new Set() };
      sessionsByUser[s.user_id].totalMinutes += s.minutes_read;
      sessionsByUser[s.user_id].days.add(s.session_date);
    }

    // Only email users who read at least once this week
    const activeUsers = authUsers.users.filter(u => u.email && sessionsByUser[u.id]?.totalMinutes > 0);
    if (!activeUsers.length) return new Response(JSON.stringify({ sent: 0, reason: "no active readers" }), { status: 200 });

    // Get leaderboard top 3 for this week
    const ranked = Object.entries(sessionsByUser)
      .map(([uid, data]) => ({ uid, minutes: data.totalMinutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3);

    const leaderNames = await Promise.all(ranked.map(async r => {
      const p = profileMap[r.uid];
      return { name: p?.display_name ?? "קורא", minutes: r.minutes };
    }));

    const results = await Promise.allSettled(
      activeUsers.map(async user => {
        const profile = profileMap[user.id];
        const firstName = (profile?.display_name ?? user.email?.split("@")[0] ?? "קורא").split(" ")[0];
        const myStats = sessionsByUser[user.id] ?? { totalMinutes: 0, days: new Set() };
        const goalMinutes = profile?.reading_goal_minutes ?? 20;
        const totalGoal = goalMinutes * 7;
        const pct = Math.min(100, Math.round((myStats.totalMinutes / totalGoal) * 100));
        const daysRead = myStats.days.size;
        const hours = Math.floor(myStats.totalMinutes / 60);
        const mins = myStats.totalMinutes % 60;
        const timeStr = hours > 0 ? `${hours}:${String(mins).padStart(2, "0")} שעות` : `${mins} דקות`;

        const leaderRows = leaderNames.map((l, i) => {
          const medals = ["🥇", "🥈", "🥉"];
          const isMe = ranked[i].uid === user.id;
          return `<tr style="background: ${isMe ? "#f0f8f0" : "transparent"};">
            <td style="padding: 8px 12px; font-size: 14px;">${medals[i]}</td>
            <td style="padding: 8px 12px; font-size: 14px; font-weight: ${isMe ? "bold" : "normal"};">${isMe ? "אתה" : l.name}</td>
            <td style="padding: 8px 12px; font-size: 14px; color: #2d4a30; font-weight: bold; text-align: left;">${Math.floor(l.minutes / 60) > 0 ? `${Math.floor(l.minutes / 60)}:${String(l.minutes % 60).padStart(2, "0")} שע׳` : `${l.minutes} דק׳`}</td>
          </tr>`;
        }).join("");

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: user.email,
            subject: `${firstName}, הנה הסיכום השבועי שלך`,
            html: `
              <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fdf8f0; border-radius: 16px; overflow: hidden;">
                <div style="background: #2d4a30; padding: 28px 32px 24px; text-align: center;">
                  <p style="font-family: Georgia, serif; font-size: 22px; letter-spacing: 6px; color: #e8dcc8; margin: 0; font-weight: bold;">AMUD</p>
                  <p style="font-size: 11px; color: #a8c4a0; margin: 4px 0 0; letter-spacing: 2px;">סיכום שבועי</p>
                </div>

                <div style="padding: 32px; color: #1a2e1a;">
                  <h2 style="font-size: 20px; margin: 0 0 8px; color: #2d4a30;">שבוע טוב, ${firstName}</h2>
                  <p style="color: #666; font-size: 13px; margin: 0 0 24px;">הנה מה שקרה השבוע בספרייה שלך</p>

                  <!-- Stats -->
                  <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                    <div style="flex: 1; background: #f0ead8; border-radius: 12px; padding: 16px; text-align: center;">
                      <p style="font-size: 26px; font-weight: 900; color: #2d4a30; margin: 0;">${timeStr}</p>
                      <p style="font-size: 11px; color: #888; margin: 4px 0 0;">קראת השבוע</p>
                    </div>
                    <div style="flex: 1; background: #f0ead8; border-radius: 12px; padding: 16px; text-align: center;">
                      <p style="font-size: 26px; font-weight: 900; color: #c47a2a; margin: 0;">${daysRead}/7</p>
                      <p style="font-size: 11px; color: #888; margin: 4px 0 0;">ימי קריאה</p>
                    </div>
                  </div>

                  <!-- Progress bar -->
                  <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                      <span style="font-size: 12px; color: #555; font-weight: 600;">יעד שבועי</span>
                      <span style="font-size: 12px; color: #888;">${myStats.totalMinutes}/${totalGoal} דקות</span>
                    </div>
                    <div style="background: #e8dcc8; border-radius: 999px; height: 8px; overflow: hidden;">
                      <div style="background: #2d4a30; height: 100%; width: ${pct}%; border-radius: 999px;"></div>
                    </div>
                  </div>

                  <!-- Leaderboard -->
                  ${leaderRows ? `
                  <div style="background: white; border-radius: 12px; overflow: hidden; margin-bottom: 24px; border: 1px solid #e8dcc8;">
                    <div style="background: #2d4a30; padding: 10px 16px;">
                      <p style="margin: 0; color: #e8dcc8; font-size: 13px; font-weight: bold;">מובילי השבוע</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                      ${leaderRows}
                    </table>
                  </div>` : ""}

                  <div style="text-align: center; margin: 28px 0 0;">
                    <a href="${APP_URL}" style="display: inline-block; background: #2d4a30; color: #e8dcc8; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      המשך לקרוא השבוע
                    </a>
                  </div>
                </div>

                <div style="padding: 16px 32px 24px; border-top: 1px solid #e8dcc8; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #999;">
                    <a href="mailto:support@amudapp.com" style="color: #999;">הסרה מרשימת התפוצה</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });
      })
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    console.log(`Weekly digest: sent=${sent}/${activeUsers.length}`);
    return new Response(JSON.stringify({ sent, total: activeUsers.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-weekly-digest error:", e);
    return new Response(String(e), { status: 500 });
  }
});
