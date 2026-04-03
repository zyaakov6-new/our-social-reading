import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Simple secret so only you can trigger this endpoint
const BROADCAST_SECRET = Deno.env.get("BROADCAST_SECRET") ?? "amud-broadcast";

webpush.setVapidDetails("mailto:support@amud.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (req) => {
  // Auth check
  const auth = req.headers.get("x-broadcast-secret");
  if (auth !== BROADCAST_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let title = "AMUD 📚";
  let body = "אפליקציית הקריאה החברתית שלך מחכה לך — בוא לקרוא היום!";
  let url = "/";

  // Allow custom payload via POST body
  if (req.method === "POST") {
    try {
      const json = await req.json();
      if (json.title) title = json.title;
      if (json.body) body = json.body;
      if (json.url) url = json.url;
    } catch {
      // use defaults
    }
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  if (!subs?.length) {
    return new Response(JSON.stringify({ sent: 0, total: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = await Promise.allSettled(
    subs.map((sub: any) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url, tag: "broadcast" })
      ).catch(async (err: any) => {
        if (err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        throw err;
      })
    )
  );

  const sent = results.filter(r => r.status === "fulfilled").length;
  return new Response(JSON.stringify({ sent, total: subs.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
