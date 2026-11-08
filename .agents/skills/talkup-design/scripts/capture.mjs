#!/usr/bin/env node
// Screenshot the real app for a pistes page (the "context" of a small change) or for a PR.
//
//   node capture.mjs <url> --out <file.png> [--theme light|dark] [--width 1440] [--height 900]
//                    [--clip <css selector>] [--click sel] [--hide sel,sel] [--full] [--storage <state file>]
//                    [--lang fr|en] [--piste A|B|C]      (pistes pages)
//
// Hides dev overlays (TanStack devtools), waits for theme transitions, toggles the
// `dark` class like the app's theme store. --clip crops to one element so the variant
// stays readable at real size in the pistes page.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { saveSession } from "./session.mjs";

const DEV_OVERLAYS =
  ".TanStackRouterDevtools,.tsqd-parent-container,[data-talkup-audit-ignore]";

function parse(argv) {
  const o = {
    theme: "light",
    width: 1440,
    height: 900,
    clip: null,
    full: false,
    storage: null,
    out: null,
    url: null,
    lang: null,
    piste: null,
    report: false,
    click: [],
    hide: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") o.out = argv[++i];
    else if (a === "--theme") o.theme = argv[++i];
    else if (a === "--width") o.width = Number(argv[++i]);
    else if (a === "--height") o.height = Number(argv[++i]);
    else if (a === "--clip") o.clip = argv[++i];
    else if (a === "--storage") o.storage = argv[++i];
    else if (a === "--full") o.full = true;
    else if (a === "--lang") o.lang = argv[++i];
    else if (a === "--piste") o.piste = argv[++i];
    else if (a === "--report") o.report = true;
    else if (a === "--click") o.click.push(argv[++i]);
    else if (a === "--hide") o.hide.push(...argv[++i].split(","));
    else if (a.startsWith("--")) {
      console.error(`unknown option ${a}`);
      process.exit(2);
    } else o.url = a;
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
  console.error(
    "usage: node capture.mjs <url> --out <file.png> [--theme light|dark] [--width 1440] [--clip sel] [--click sel] [--hide sel,sel] [--full] [--storage <state file>]",
  );
  process.exit(2);
}
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: o.width, height: o.height },
    storageState: o.storage || undefined,
  });
  // Theme the way the app does: persisted theme store read on load, plus the media query.
  await context.addInitScript((t) => {
    try {
      localStorage.setItem(
        "theme-storage",
        JSON.stringify({ state: { theme: t }, version: 0 }),
      );
    } catch {
      /* no storage on this origin */
    }
  }, o.theme);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.emulateMedia({
    colorScheme: o.theme === "dark" ? "dark" : "light",
  });
  await page.goto(o.url, { waitUntil: "networkidle" });
  const want = new URL(o.url);
  if (
    want.protocol.startsWith("http") &&
    new URL(page.url()).pathname.startsWith("/login") &&
    !want.pathname.startsWith("/login")
  ) {
    console.error(
      `${o.url} redirected to /login: the session expired. Run login.mjs again and retry.`,
    );
    process.exitCode = 3;
    await browser.close();
    process.exit(3);
  }
  await page.addStyleTag({
    content: `${[DEV_OVERLAYS, ...o.hide].join(",")}{display:none!important}`,
  });
  // Open a tab, a menu, a panel… before the shot.
  for (const sel of o.click) {
    await page.click(sel);
    await settle(page);
  }
  // The app reads the `dark` class; pistes pages read data-theme / data-lang / data-current.
  await page.evaluate(
    ({ dark, lang, piste }) => {
      const html = document.documentElement;
      html.classList.remove("light", "dark");
      html.classList.add(dark ? "dark" : "light");
      html.style.colorScheme = dark ? "dark" : "light";
      if (html.hasAttribute("data-theme"))
        html.dataset.theme = dark ? "dark" : "light";
      if (lang) {
        html.dataset.lang = lang;
        html.lang = lang;
      }
      if (piste)
        document
          .querySelectorAll(".piste")
          .forEach((p) =>
            p.toggleAttribute("data-current", p.dataset.piste === piste),
          );
    },
    { dark: o.theme === "dark", lang: o.lang, piste: o.piste },
  );
  await page.waitForTimeout(50);
  await settle(page);
  if (o.clip) await page.locator(o.clip).first().screenshot({ path: o.out });
  else await page.screenshot({ path: o.out, fullPage: o.full });
  console.log(o.out);
  if (o.report)
    console.log(
      JSON.stringify(
        await page.evaluate(
          (hide) => ({
            theme: document.documentElement.classList.contains("dark")
              ? "dark"
              : "light",
            lang:
              document.documentElement.dataset.lang ||
              document.documentElement.lang,
            piste:
              document.querySelector(".piste[data-current]")?.dataset.piste ??
              null,
            storeTheme: (() => {
              try {
                return JSON.parse(localStorage.getItem("theme-storage")).state
                  .theme;
              } catch {
                return null;
              }
            })(),
            hidden: hide.length
              ? document.querySelectorAll(hide.join(",")).length
              : 0,
          }),
          o.hide,
        ),
      ),
    );
} finally {
  // Sessions rotate on use: keep the newest one for the next capture or audit.
  const context = browser.contexts()[0];
  if (o.storage && context)
    await saveSession(context, o.storage).catch(() => {});
  await browser.close();
}
