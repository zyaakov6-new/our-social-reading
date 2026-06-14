// Generates public/og-image.png (1200x630) for social link previews.
// Run: node scripts/generate-og.mjs   (requires: npx playwright install chromium)
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "public", "og-image.png");

const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700;900&family=Heebo:wght@400;500;700;800&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    font-family: 'Heebo', sans-serif;
    background:
      radial-gradient(circle at 88% 18%, hsl(126 22% 40% / 0.18), transparent 42%),
      radial-gradient(circle at 8% 90%, hsl(188 60% 35% / 0.14), transparent 45%),
      hsl(44 27% 86%);
    position: relative;
  }
  .frame { position: absolute; inset: 0; padding: 72px 80px; display: flex; flex-direction: column; justify-content: center; }
  .kicker { display: inline-flex; align-items: center; gap: 10px; align-self: flex-start;
    background: hsl(126 15% 28% / 0.10); color: hsl(126 15% 28%);
    font-weight: 800; font-size: 22px; letter-spacing: 2px; padding: 10px 20px; border-radius: 999px; }
  .wordmark { display: flex; align-items: center; gap: 18px; margin: 26px 0 10px; }
  .bar { width: 10px; height: 96px; border-radius: 6px; background: hsl(126 15% 28%); }
  .amud { font-family: 'Playfair Display', serif; font-weight: 900; font-size: 150px; letter-spacing: 10px; color: hsl(126 15% 24%); line-height: 1; }
  .tagline { font-family: 'Frank Ruhl Libre', serif; font-weight: 700; font-size: 58px; color: hsl(210 11% 16%); margin-top: 18px; }
  .sub { font-size: 30px; font-weight: 500; color: hsl(210 8% 38%); margin-top: 22px; }
  .chips { display: flex; gap: 16px; margin-top: 40px; }
  .chip { display: inline-flex; align-items: center; gap: 10px; background: #fff; border: 1px solid hsl(44 15% 80%);
    border-radius: 999px; padding: 14px 26px; font-size: 26px; font-weight: 700; color: hsl(210 11% 18%);
    box-shadow: 0 8px 24px hsl(126 15% 12% / 0.08); }
  .url { position: absolute; bottom: 56px; left: 80px; font-size: 26px; font-weight: 700; color: hsl(126 15% 28%); letter-spacing: 1px; }
</style>
</head>
<body>
  <div class="frame">
    <span class="kicker">מעקב קריאה חברתי · בעברית</span>
    <div class="wordmark">
      <span class="bar"></span>
      <span class="amud">AMUD</span>
    </div>
    <div class="tagline">סוף סוף תסיים את הספרים שהתחלת.</div>
    <div class="sub">תיעוד של 20 שניות · רצף יומי · אתגרים עם חברים</div>
    <div class="chips">
      <span class="chip">🔥 רצף יומי</span>
      <span class="chip">🏆 אתגרים</span>
      <span class="chip">📚 הספרייה שלך</span>
    </div>
  </div>
  <div class="url">amudapp.com</div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: out });
await browser.close();
console.log("OG image written to", out);
