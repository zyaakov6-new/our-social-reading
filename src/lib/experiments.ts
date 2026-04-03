export const LANDING_EXPERIMENT_KEY = "amud_exp_landing_guest_funnel_v1";

export const landingExperimentVariants = ["auth_first", "guest_first"] as const;

export type LandingExperimentVariant = (typeof landingExperimentVariants)[number];

const defaultVariant: LandingExperimentVariant = "guest_first";

export const getStoredLandingVariant = () => {
  if (typeof window === "undefined") {
    return defaultVariant;
  }

  const existing = window.localStorage.getItem(LANDING_EXPERIMENT_KEY);
  if (existing === "auth_first" || existing === "guest_first") {
    return existing;
  }

  const assigned =
    Math.random() < 0.5
      ? landingExperimentVariants[0]
      : landingExperimentVariants[1];

  window.localStorage.setItem(LANDING_EXPERIMENT_KEY, assigned);
  return assigned;
};
