export type AuthMode = "signup" | "login";

export interface AuthIntent {
  source?: string;
  variant?: string;
  mode?: AuthMode;
  next?: string | null;
  action?: string;
}

const AUTH_INTENT_KEY = "amud_auth_intent";

export const sanitizeReturnTo = (value: string | null | undefined) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
};

export const buildAuthPath = (
  mode: AuthMode,
  options: {
    next?: string | null;
    source?: string;
    variant?: string;
    action?: string;
  } = {},
) => {
  const searchParams = new URLSearchParams({ mode });
  const next = sanitizeReturnTo(options.next);

  if (next) {
    searchParams.set("next", next);
  }

  if (options.source) {
    searchParams.set("source", options.source);
  }

  if (options.variant) {
    searchParams.set("variant", options.variant);
  }

  if (options.action) {
    searchParams.set("action", options.action);
  }

  return `/auth?${searchParams.toString()}`;
};

export const storeAuthIntent = (intent: AuthIntent) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(AUTH_INTENT_KEY, JSON.stringify(intent));
};

export const readAuthIntent = (): AuthIntent | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(AUTH_INTENT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthIntent;
  } catch {
    return null;
  }
};

export const clearAuthIntent = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_INTENT_KEY);
};
