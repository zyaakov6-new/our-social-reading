import { track } from "@vercel/analytics";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export const trackEvent = (name: string, payload: AnalyticsPayload = {}) => {
  try {
    track(name, payload);
  } catch {
    // Analytics should never break the product flow.
  }
};
