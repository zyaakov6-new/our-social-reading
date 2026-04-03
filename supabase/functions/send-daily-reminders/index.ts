import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails("mailto:support@amudapp.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Rotate messages so users don't see the same one every night
const MESSAGES = [
  { title: "AMUD 📚", body: "עוד לא קראת היום - שמור על הרצף שלך 🔥" },
  { title: "הרצף שלך מחכה 🔥", body: "כמה דקות קריאה עכשיו ישמרו על הסטריק" },
  { title: "AMUD 📖", body: "חברים שלך כבר קראו היום - מה איתך?" },
  { title: "יום חדש, עמוד חדש 📚", body: "פתח ספר ל-5 דקות - זה מספיק" },
  { title: "לא לשבור עכשיו 🔥", body: "רצף ימים יפה מחכה לך ב-AMUD" },
];

Deno.serve(async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const msg = MESSAGES[dayOfYear % MESSAGES.length];

    // Get all push subscribers
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (!subs?.length) return new Response(JSON.stringify({ sent: 0, total: 0 }), { status: 200 });

    // Find users who already read today
    const userIds = subs.map((s: any) => s.user_id);
    const { data: todaySessions } = await supabase
      .from("reading_sessions")
      .select("user_id")
      .in("user_id", userIds)
      .eq("session_date", today);

    const readTodaySet = new Set((todaySessions ?? []).map((s: any) => s.user_id));
    const toNotify = subs.filter((s: any) => !readTodaySet.has(s.user_id));

    const results = await Promise.allSettled(
      toNotify.map((sub: any) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: msg.title, body: msg.body, url: "/", tag: "daily-reminder" })
        ).catch(async (err: any) => {
          if (err.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
          throw err;
        })
      )
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    console.log(`Daily reminders: sent=${sent} total=${toNotify.length} skipped=${subs.length - toNotify.length}`);
    return new Response(JSON.stringify({ sent, total: toNotify.length, alreadyRead: readTodaySet.size }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-daily-reminders error:", e);
    return new Response(String(e), { status: 500 });
  }
});
