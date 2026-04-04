/**
 * paddle-webhook
 * Handles Paddle Billing subscription lifecycle events.
 * Verifies the Paddle-Signature header using HMAC-SHA256.
 *
 * Required env vars (set in Supabase Dashboard > Edge Functions > Secrets):
 *   PADDLE_WEBHOOK_SECRET   – Notification secret from Paddle Dashboard
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("PADDLE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── HMAC-SHA256 verification ──────────────────────────────────────────────────
async function verifySignature(
  rawBody: string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader || !WEBHOOK_SECRET) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const computed = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === h1;
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("paddle-signature");

  const valid = await verifySignature(rawBody, signatureHeader);
  if (!valid) {
    console.error("Invalid Paddle signature");
    return new Response("Unauthorized", { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const eventType: string = event.event_type ?? "";
  const data = event.data ?? {};

  console.log(`Paddle event: ${eventType}`, JSON.stringify(data).slice(0, 200));

  // ── Extract user_id from customData ────────────────────────────────────────
  // We pass customData: { user_id } when opening the checkout
  const userId: string | undefined =
    data.custom_data?.user_id ??
    data.subscription?.custom_data?.user_id;

  // ── Subscription events ────────────────────────────────────────────────────
  if (
    eventType === "subscription.activated" ||
    eventType === "subscription.updated" ||
    eventType === "subscription.created"
  ) {
    const subscriptionId: string = data.id;
    const customerId: string = data.customer_id;
    const status: string = data.status; // active | trialing | past_due | canceled | paused
    const priceId: string | undefined = data.items?.[0]?.price?.id;
    const currentPeriodEnd: string | undefined =
      data.current_billing_period?.ends_at;
    const cancelAtPeriodEnd: boolean =
      data.scheduled_change?.action === "cancel";

    const isPro = status === "active" || status === "trialing";

    if (!userId) {
      console.error("No user_id in customData for subscription", subscriptionId);
    } else {
      // Upsert subscription row
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          paddle_subscription_id: subscriptionId,
          paddle_customer_id: customerId,
          status,
          price_id: priceId,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "paddle_subscription_id" }
      );

      // Update profile
      await supabase
        .from("profiles")
        .update({
          is_pro: isPro,
          paddle_customer_id: customerId,
          subscription_status: status,
        })
        .eq("user_id", userId);

      console.log(`User ${userId} → is_pro=${isPro} status=${status}`);
    }
  } else if (eventType === "subscription.canceled") {
    const subscriptionId: string = data.id;

    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", subscriptionId);

    if (userId) {
      await supabase
        .from("profiles")
        .update({ is_pro: false, subscription_status: "canceled" })
        .eq("user_id", userId);
      console.log(`User ${userId} → is_pro=false (canceled)`);
    }
  } else if (eventType === "subscription.past_due") {
    const subscriptionId: string = data.id;
    await supabase
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("paddle_subscription_id", subscriptionId);

    if (userId) {
      await supabase
        .from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("user_id", userId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
