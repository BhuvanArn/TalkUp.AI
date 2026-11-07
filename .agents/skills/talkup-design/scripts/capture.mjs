#!/usr/bin/env node
// Screenshot the real app for a pistes page (the "context" of a small change) or for a PR.
//
//   node capture.mjs <url> --out <file.png> [--theme light|dark] [--width 1440] [--height 900]
//                    [--clip <css selector>] [--full] [--storage state.json]
//
// Hides dev overlays (TanStack devtools), waits for theme transitions, toggles the
// `dark` class like the app's theme store. --clip crops to one element so the variant
// stays readable at real size in the pistes page.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const DEV_OVERLAYS = '.TanStackRouterDevtools,.tsqd-parent-container,[data-talkup-audit-ignore]';

function parse(argv) {
  const o = { theme: 'light', width: 1440, height: 900, clip: null, full: false, storage: null, out: null, url: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--theme') o.theme = argv[++i];
    else if (a === '--width') o.width = Number(argv[++i]);
    else if (a === '--height') o.height = Number(argv[++i]);
    else if (a === '--clip') o.clip = argv[++i];
    else if (a === '--storage') o.storage = argv[++i];
    else if (a === '--full') o.full = true;
    else o.url = a;
  }
  return o;
}

const settle = (page) =>
  page.evaluate(() =>
    Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      ),
      new Promise((r) => setTimeout(r, 3000)),
    ]),
  );

const o = parse(process.argv.slice(2));
if (!o.url || !o.out) {
  console.error('usage: node capture.mjs <url> --out <file.png> [--theme light|dark] [--width 1440] [--clip sel] [--full] [--storage state.json]');
  process.exit(2);
}
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: o.width, height: o.height }, storageState: o.storage || undefined });
  const page = await context.newPage();
  await page.goto(o.url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: `${DEV_OVERLAYS}{display:none!important}` });
  await page.evaluate((dark) => document.documentElement.classList.toggle('dark', dark), o.theme === 'dark');
  await page.waitForTimeout(50);
  await settle(page);
  if (o.clip) await page.locator(o.clip).first().screenshot({ path: o.out });
  else await page.screenshot({ path: o.out, fullPage: o.full });
  console.log(o.out);
} finally {
  await browser.close();
}
