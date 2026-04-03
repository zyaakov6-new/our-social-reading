import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LANDING_EXPERIMENT_KEY,
  getStoredLandingVariant,
} from "@/lib/experiments";

describe("landing experiments", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persists the assigned landing variant", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const first = getStoredLandingVariant();
    const second = getStoredLandingVariant();

    expect(first).toBe("auth_first");
    expect(second).toBe("auth_first");
    expect(localStorage.getItem(LANDING_EXPERIMENT_KEY)).toBe("auth_first");
  });
});
