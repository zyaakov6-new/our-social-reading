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
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Users created 24-48h ago who haven't signed in since signup
    const { data: users } = await supabase.auth.admin.listUsers();
    if (!users?.users?.length) return new Response("no users", { status: 200 });

    const targets = users.users.filter(u => {
      if (!u.email) return false;
      const created = new Date(u.created_at);
      const lastSignIn = new Date(u.last_sign_in_at ?? u.created_at);
      const createdInWindow = created >= twoDaysAgo && created <= oneDayAgo;
      const neverReturned = Math.abs(lastSignIn.getTime() - created.getTime()) < 60_000;
      return createdInWindow && neverReturned;
    });

    if (!targets.length) return new Response(JSON.stringify({ sent: 0, reason: "no targets" }), { status: 200 });

    // Get display names from profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", targets.map(u => u.id));

    const nameMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.display_name]));

    const results = await Promise.allSettled(
      targets.map(async user => {
        const name = nameMap[user.id] ?? user.email?.split("@")[0] ?? "קורא";
        const firstName = name.split(" ")[0];

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: user.email,
            subject: `${firstName}, יום שני הוא החלק הקשה`,
            html: `
              <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fdf8f0; border-radius: 16px; overflow: hidden;">
                <!-- Header -->
                <div style="background: #2d4a30; padding: 28px 32px 24px; text-align: center;">
                  <p style="font-family: Georgia, serif; font-size: 22px; letter-spacing: 6px; color: #e8dcc8; margin: 0; font-weight: bold;">AMUD</p>
                  <p style="font-size: 11px; color: #a8c4a0; margin: 4px 0 0; letter-spacing: 2px;">עמוד</p>
                </div>

                <!-- Body -->
                <div style="padding: 32px; color: #1a2e1a;">
                  <h2 style="font-size: 20px; margin: 0 0 16px; color: #2d4a30;">היי ${firstName},</h2>

                  <p style="line-height: 1.7; margin: 0 0 16px; font-size: 15px;">
                    הצטרפת ל-AMUD אתמול. רוב האנשים לא חוזרים ביום השני - וזה בדיוק למה הרגל קריאה אף פעם לא נבנה.
                  </p>

                  <div style="background: #f0ead8; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-right: 3px solid #2d4a30;">
                    <p style="margin: 0; font-size: 14px; color: #4a6b4a; line-height: 1.6;">
                      <strong>5 דקות קריאה היום</strong> = רצף של יומיים.<br>
                      רצף של שבוע = הרגל שמתחיל להישמר לבד.
                    </p>
                  </div>

                  <p style="line-height: 1.7; margin: 0 0 24px; font-size: 15px;">
                    פתח ספר, תעד את הקריאה, ותראה את הרצף שלך עולה. זה לוקח פחות מדקה.
                  </p>

                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${APP_URL}" style="display: inline-block; background: #2d4a30; color: #e8dcc8; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; letter-spacing: 0.5px;">
                      פתח את AMUD עכשיו
                    </a>
                  </div>
                </div>

                <!-- Footer -->
                <div style="padding: 16px 32px 24px; border-top: 1px solid #e8dcc8; text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #999; line-height: 1.8;">
                    קיבלת מייל זה כי נרשמת ל-AMUD.<br>
                    <a href="mailto:support@amudapp.com" style="color: #999;">להסרה מהרשימה</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Resend error for ${user.email}: ${err}`);
        }
      })
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const errors = results.filter(r => r.status === "rejected").map(r => (r as PromiseRejectedResult).reason?.message);
    console.log(`Day-2 emails: sent=${sent}/${targets.length}`, errors.length ? `errors=${JSON.stringify(errors)}` : "");
    return new Response(JSON.stringify({ sent, total: targets.length, errors }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("day2-retention-email error:", e);
    return new Response(String(e), { status: 500 });
  }
});
