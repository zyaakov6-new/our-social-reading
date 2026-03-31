import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "AMUD <noreply@amud.app>";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Users created 24-48h ago who haven't signed in since signup
    const { data: users } = await supabase.auth.admin.listUsers();
    if (!users?.users?.length) return new Response("no users", { status: 200 });

    const targets = users.users.filter(u => {
      const created = new Date(u.created_at);
      const lastSignIn = new Date(u.last_sign_in_at ?? u.created_at);
      const createdInWindow = created >= twoDaysAgo && created <= oneDayAgo;
      // Only signed in once (last_sign_in == created_at, within 60s)
      const neverReturned = Math.abs(lastSignIn.getTime() - created.getTime()) < 60_000;
      return createdInWindow && neverReturned;
    });

    if (!targets.length) return new Response("no targets", { status: 200 });

    // Get their profile names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", targets.map(u => u.id));

    const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.display_name]));

    const results = await Promise.allSettled(
      targets.map(async user => {
        const name = nameMap[user.id] ?? user.email?.split("@")[0] ?? "קורא";
        const firstName = name.split(" ")[0];

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: user.email,
            subject: `${firstName}, אל תפסיק עכשיו 📚`,
            html: `
              <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a2e1a;">
                <h2 style="color: #2d4a30; margin-bottom: 8px;">היי ${firstName} 👋</h2>
                <p style="line-height: 1.6; margin-bottom: 16px;">
                  הצטרפת ל-AMUD אתמול — מעולה. עכשיו החלק הקשה: לחזור ביום השני.
                </p>
                <p style="line-height: 1.6; margin-bottom: 24px;">
                  5 דקות קריאה היום יוצרות רצף של יומיים. רצף של שבוע משנה הרגלים.
                </p>
                <a href="https://amud.app" style="display: inline-block; background: #2d4a30; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">
                  פתח את AMUD ←
                </a>
                <p style="margin-top: 32px; font-size: 12px; color: #888;">
                  להסרה מהרשימה — <a href="mailto:support@amud.app" style="color: #888;">שלח מייל</a>
                </p>
              </div>
            `,
          }),
        });
      })
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    return new Response(JSON.stringify({ sent, total: targets.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
