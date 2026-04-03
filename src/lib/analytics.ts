import { track } from "@vercel/analytics";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export const trackEvent = (name: string, payload: AnalyticsPayload = {}) => {
  if (import.meta.env.DEV) {
    console.debug("[analytics]", name, payload);
  }

  try {
    track(name, payload);
  } catch {
    // Analytics should never break the product flow.
  }
};
