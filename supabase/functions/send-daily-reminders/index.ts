import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

webpush.setVapidDetails("mailto:support@amud.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get all push subscribers who haven't read today
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (!subs?.length) return new Response("no subscribers", { status: 200 });

    // Find which users already read today
    const userIds = subs.map((s: any) => s.user_id);
    const { data: todaySessions } = await supabase
      .from("reading_sessions")
      .select("user_id")
      .in("user_id", userIds)
      .eq("session_date", today);

    const readTodaySet = new Set((todaySessions ?? []).map((s: any) => s.user_id));

    // Send push only to those who haven't read today
    const toNotify = subs.filter((s: any) => !readTodaySet.has(s.user_id));

    const results = await Promise.allSettled(
      toNotify.map((sub: any) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: "AMUD 📚",
            body: "עוד לא קראת היום — שמור על הרצף שלך 🔥",
            url: "/",
            tag: "daily-reminder",
          })
        ).catch(async (err: any) => {
          // Subscription expired — clean it up
          if (err.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
          throw err;
        })
      )
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    return new Response(JSON.stringify({ sent, total: toNotify.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
