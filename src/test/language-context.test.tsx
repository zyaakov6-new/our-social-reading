import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

const Consumer = () => {
  const { lang, dir, t } = useLanguage();
  return (
    <div data-testid="language-consumer">
      {lang}|{dir}|{t.common.join}
    </div>
  );
};

describe("LanguageProvider", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container?.remove();
    container = null;
    root = null;
    localStorage.clear();
    document.documentElement.lang = "";
    document.documentElement.dir = "";
    vi.restoreAllMocks();
  });

  it("renders immediately with a saved language preference", () => {
    localStorage.setItem("amud_lang", "en");
    localStorage.setItem("amud_lang_detected", "1");

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <LanguageProvider>
          <Consumer />
        </LanguageProvider>
      );
    });

    expect(container.textContent).toContain("en|ltr|Join");
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
