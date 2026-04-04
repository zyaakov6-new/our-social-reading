import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubInfo {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionContextType {
  isPro: boolean;
  isLoading: boolean;
  subscription: SubInfo | null;
  openCheckout: () => void;
  openManage: () => void;
}

// ── Env vars ──────────────────────────────────────────────────────────────────
const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
const PADDLE_PRICE_ID = import.meta.env.VITE_PADDLE_PRICE_ID as string | undefined;
const IS_SANDBOX = import.meta.env.VITE_PADDLE_SANDBOX === "true";

declare global {
  interface Window {
    Paddle: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const SubscriptionContext = createContext<SubscriptionContextType>({
  isPro: false,
  isLoading: true,
  subscription: null,
  openCheckout: () => {},
  openManage: () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

// ── Provider ──────────────────────────────────────────────────────────────────
export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubInfo | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);

  // ── Load Paddle.js once ────────────────────────────────────────────────────
  useEffect(() => {
    if (!PADDLE_CLIENT_TOKEN) return;
    if (window.Paddle) {
      initPaddle();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = initPaddle;
    document.head.appendChild(script);
  }, []);

  const initPaddle = () => {
    if (!window.Paddle || !PADDLE_CLIENT_TOKEN) return;
    const opts: Record<string, unknown> = { token: PADDLE_CLIENT_TOKEN };
    if (IS_SANDBOX) opts.environment = "sandbox";
    window.Paddle.Initialize(opts);
    setPaddleReady(true);
  };

  // ── Fetch subscription status ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setIsPro(false);
      setIsLoading(false);
      setSubscription(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      const [{ data: profile }, { data: sub }] = await Promise.all([
        supabase
          .from("profiles")
          .select("is_pro")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("subscriptions")
          .select("status, current_period_end, cancel_at_period_end")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;
      setIsPro(profile?.is_pro ?? false);
      setSubscription(
        sub
          ? {
              status: sub.status,
              currentPeriodEnd: sub.current_period_end,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            }
          : null
      );
      setIsLoading(false);
    };

    load();

    // Realtime: reflect instant Pro upgrade after Paddle webhook fires
    const channel = supabase
      .channel(`pro:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setIsPro(payload.new.is_pro ?? false);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ── Open Paddle checkout overlay ───────────────────────────────────────────
  const openCheckout = useCallback(() => {
    if (!paddleReady || !PADDLE_PRICE_ID) {
      console.warn("Paddle not ready or VITE_PADDLE_PRICE_ID not set");
      return;
    }
    window.Paddle.Checkout.open({
      items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
      ...(user?.email ? { customer: { email: user.email } } : {}),
      customData: user ? { user_id: user.id } : undefined,
    });
  }, [paddleReady, user]);

  // ── Open Paddle customer portal ────────────────────────────────────────────
  const openManage = useCallback(() => {
    // Paddle Billing: open self-serve portal via overlay
    if (!paddleReady) return;
    window.Paddle.Checkout.open({ settings: { displayMode: "overlay" } });
  }, [paddleReady]);

  return (
    <SubscriptionContext.Provider
      value={{ isPro, isLoading, subscription, openCheckout, openManage }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
