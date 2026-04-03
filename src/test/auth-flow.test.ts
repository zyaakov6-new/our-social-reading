import { describe, expect, it } from "vitest";
import { buildAuthPath, sanitizeReturnTo } from "@/lib/auth-flow";

describe("auth flow helpers", () => {
  it("keeps only safe internal return paths", () => {
    expect(sanitizeReturnTo("/search?q=test")).toBe("/search?q=test");
    expect(sanitizeReturnTo("https://example.com")).toBeNull();
    expect(sanitizeReturnTo("//evil.com")).toBeNull();
    expect(sanitizeReturnTo("profile")).toBeNull();
  });

  it("builds auth paths with preserved context", () => {
    expect(
      buildAuthPath("signup", {
        next: "/search?source=landing",
        source: "landing",
        variant: "guest_first",
        action: "save_book",
      }),
    ).toBe(
      "/auth?mode=signup&next=%2Fsearch%3Fsource%3Dlanding&source=landing&variant=guest_first&action=save_book",
    );
  });
});
