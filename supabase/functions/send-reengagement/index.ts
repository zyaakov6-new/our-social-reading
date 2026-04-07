/**
 * send-reengagement
 *
 * Runs daily. Emails users who:
 *   1. Haven't logged a reading session in the past 3–6 days (quiet window)
 *   2. Do NOT have an active push-notification subscription
 *      (those users already get the daily push reminder)
 *
 * The 3-day lower bound avoids emailing too early.
 * The 6-day upper bound stops emailing if they've truly churned
 * (the weekly digest covers Pro users beyond that).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY    = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL        = "AMUD <noreply@amudapp.com>";
const APP_URL           = "https://www.amudapp.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MESSAGES = [
  {
    subject: (name: string) => `${name}, הספר שלך מחכה לך`,
    body: (name: string) => `
      <h2 style="font-size: 20px; margin: 0 0 16px; color: #2d4a30;">היי ${name},</h2>
      <p style="line-height: 1.7; margin: 0 0 16px; font-size: 15px;">
        עברו כמה ימים מאז שקראת לאחרונה ב-AMUD. הספר שלך עדיין שם, מחכה לעמוד הבא.
      </p>
      <div style="background: #f0ead8; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-right: 3px solid #2d4a30;">
        <p style="margin: 0; font-size: 14px; color: #4a6b4a; line-height: 1.6;">
          <strong>5 דקות קריאה היום</strong> מספיקות כדי לשמור על הרגל.<br>
          לא צריך יותר מזה.
        </p>
      </div>
    `,
  },
  {
    subject: (name: string) => `${name}, כמה עמודים נשארו לך?`,
    body: (name: string) => `
      <h2 style="font-size: 20px; margin: 0 0 16px; color: #2d4a30;">היי ${name},</h2>
      <p style="line-height: 1.7; margin: 0 0 16px; font-size: 15px;">
        לא ראינו אותך כמה ימים. חברים ב-AMUD המשיכו לקרוא — ואתה?
      </p>
      <div style="background: #f0ead8; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-right: 3px solid #2d4a30;">
        <p style="margin: 0; font-size: 14px; color: #4a6b4a; line-height: 1.6;">
          כל ספר נגמר עמוד אחד בכל פעם.<br>
          <strong>היום יכול להיות היום שתתחדש.</strong>
        </p>
      </div>
    `,
  },
  {
    subject: (name: string) => `${name}, הרצף שלך מחכה לחזור`,
    body: (name: string) => `
      <h2 style="font-size: 20px; margin: 0 0 16px; color: #2d4a30;">היי ${name},</h2>
      <p style="line-height: 1.7; margin: 0 0 16px; font-size: 15px;">
        הפסקות בקריאה קורות לכולם. החלק החשוב הוא לחזור.
      </p>
      <div style="background: #f0ead8; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-right: 3px solid #2d4a30;">
        <p style="margin: 0; font-size: 14px; color: #4a6b4a; line-height: 1.6;">
          <strong>פתח את AMUD עכשיו</strong>, תעד אפילו 5 דקות,<br>
          ותתחיל רצף חדש מאפס.
        </p>
      </div>
    `,
  },
];

Deno.serve(async () => {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const sixDaysAgo   = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // All auth users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const allUsers = authData?.users ?? [];
    if (!allUsers.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

    const userIds = allUsers.map(u => u.id);

    // Get profiles for display names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);
    const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.display_name ?? ""]));

    // Get each user's most recent session date
    const { data: recentSessions } = await supabase
      .from("reading_sessions")
      .select("user_id, session_date")
      .in("user_id", userIds)
      .gte("session_date", sixDaysAgo)       // only look at recent history
      .order("session_date", { ascending: false });

    // Most-recent session date per user
    const lastSessionMap: Record<string, string> = {};
    for (const s of recentSessions ?? []) {
      if (!lastSessionMap[s.user_id]) lastSessionMap[s.user_id] = s.session_date;
    }

    // Users who have push subscriptions (they get push reminders instead)
    const { data: pushSubs } = await supabase
      .from("push_subscriptions")
      .select("user_id")
      .in("user_id", userIds);
    const hasPushSet = new Set((pushSubs ?? []).map((s: any) => s.user_id));

    // Target: last session was 3–6 days ago AND no push subscription
    const targets = allUsers.filter(u => {
      if (!u.email) return false;
      if (hasPushSet.has(u.id)) return false;        // already gets push reminders
      const last = lastSessionMap[u.id];
      if (!last) return false;                       // never read or too long ago
      return last <= threeDaysAgo && last >= sixDaysAgo;
    });

    if (!targets.length) {
      console.log("send-reengagement: no targets today");
      return new Response(JSON.stringify({ sent: 0, reason: "no targets" }), { status: 200 });
    }

    // Rotate message variant by day so it doesn't feel mechanical
    const dayOfYear = Math.floor((Date.now() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const variant = MESSAGES[dayOfYear % MESSAGES.length];

    const results = await Promise.allSettled(
      targets.map(async user => {
        const rawName  = nameMap[user.id] ?? user.email?.split("@")[0] ?? "קורא";
        const firstName = rawName.split(" ")[0];

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: user.email,
            subject: variant.subject(firstName),
            html: `
              <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fdf8f0; border-radius: 16px; overflow: hidden;">
                <div style="background: #2d4a30; padding: 28px 32px 24px; text-align: center;">
                  <p style="font-family: Georgia, serif; font-size: 22px; letter-spacing: 6px; color: #e8dcc8; margin: 0; font-weight: bold;">AMUD</p>
                  <p style="font-size: 11px; color: #a8c4a0; margin: 4px 0 0; letter-spacing: 2px;">קריאה חברתית</p>
                </div>

                <div style="padding: 32px; color: #1a2e1a;">
                  ${variant.body(firstName)}

                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${APP_URL}" style="display: inline-block; background: #2d4a30; color: #e8dcc8; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; letter-spacing: 0.5px;">
                      חזור לקרוא עכשיו
                    </a>
                  </div>
                </div>

                <div style="padding: 16px 32px 24px; border-top: 1px solid #e8dcc8; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #999; line-height: 1.8;">
                    קיבלת מייל זה כי אתה רשום ב-AMUD.<br>
                    <a href="mailto:support@amudapp.com" style="color: #999;">הסרה מרשימת התפוצה</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Resend error ${user.email}: ${err}`);
        }
      })
    );

    const sent   = results.filter(r => r.status === "fulfilled").length;
    const errors = results.filter(r => r.status === "rejected").map(r => (r as PromiseRejectedResult).reason?.message);
    console.log(`send-reengagement: sent=${sent}/${targets.length}`, errors.length ? errors : "");
    return new Response(JSON.stringify({ sent, total: targets.length, errors }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-reengagement error:", e);
    return new Response(String(e), { status: 500 });
  }
});
