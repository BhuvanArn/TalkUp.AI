#!/usr/bin/env node
// Run the TalkUp design audit on a page, in each theme and width.
//
//   node run-audit.mjs <url> [--themes light,dark] [--width 1440,390] [--root main]
//                      [--ignore sel,sel] [--axe] [--no-focus] [--storage <state file>] [--json]
//
// Needs @playwright/test (repo devDependency) and Chromium (`npx playwright install chromium`).
// Theme switch = toggling the `dark` class on <html>, like the app's theme store.
// --storage reuses a Playwright storage state (cookies) for signed-in pages.
// Exit code 1 when any FAIL finding exists.
import { chromium } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEV_OVERLAYS,
  SessionExpired,
  checkSession,
  openApp,
  settle,
  trackNetwork,
  waitForApp,
} from "./app.mjs";
import { saveSession, warnSaveFailed } from "./session.mjs";

const AUDIT = join(dirname(fileURLToPath(import.meta.url)), "audit.js");
const AXE = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";

function parseArgs(argv) {
  const o = {
    themes: ["light", "dark"],
    widths: [1440, 390],
    root: "body",
    ignore: [],
    axe: false,
    focus: true,
    json: false,
    storage: null,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--themes") o.themes = argv[++i].split(",");
    else if (a === "--width") o.widths = argv[++i].split(",").map(Number);
    else if (a === "--root") o.root = argv[++i];
    else if (a === "--storage") o.storage = argv[++i];
    else if (a === "--ignore") o.ignore = argv[++i].split(",");
    else if (a === "--axe") o.axe = true;
    else if (a === "--no-focus") o.focus = false;
    else if (a === "--json") o.json = true;
    else rest.push(a);
  }
  o.url = rest[0];
  return o;
}

async function focusFindings(page, max = 60) {
  const out = [];
  const seen = new Set();
  // The page is reused across themes and widths: clear marks from the previous walk.
  const unmark = () =>
    page.evaluate(() => {
      document
        .querySelectorAll("[data-audit-focused]")
        .forEach((e) => e.removeAttribute("data-audit-focused"));
      document.activeElement?.blur();
    });
  await unmark();
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate((skip) => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      if (el.closest(skip))
        return { id: "__skip__" + Math.random(), visible: true };
      // Focus rings are often animated (transition-all): read the end state.
      for (const a of el.getAnimations()) {
        try {
          a.finish();
        } catch {
          /* infinite animation */
        }
      }
      const s = getComputedStyle(el);
      const outline =
        s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
      const shadow = s.boxShadow && s.boxShadow !== "none";
      const id = el.id
        ? `#${el.id}`
        : `${el.tagName.toLowerCase()}:${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}`;
      // Detect the wrap-around on the element itself: two controls can share a label.
      const wrapped = el.hasAttribute("data-audit-focused");
      el.setAttribute("data-audit-focused", "");
      return { id, visible: outline || shadow, wrapped };
    }, DEV_OVERLAYS);
    if (!r) continue;
    if (r.wrapped) break;
    if (seen.has(r.id)) continue; // same label already reported
    seen.add(r.id);
    if (!r.visible)
      out.push({
        rule: "focus.missing",
        severity: "FAIL",
        selector: r.id,
        measured: "no outline or ring",
        norm: "visible focus, ≥2px, ≥3:1",
        message: `${r.id} shows no focus indicator when reached with Tab.`,
      });
  }
  await unmark();
  return out;
}

async function reducedMotionFindings(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const n = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === "running" &&
            a.effect?.getTiming().iterations === Infinity,
        ).length,
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  return n
    ? [
        {
          rule: "motion.reduced",
          severity: "WARN",
          selector: "",
          measured: `${n} infinite animation(s)`,
          norm: "none under prefers-reduced-motion",
          message: `${n} looping animation(s) keep running with prefers-reduced-motion: reduce.`,
        },
      ]
    : [];
}

// Same zone as the rendered audit: --root limits it, --ignore and dev overlays are skipped.
async function axeFindings(page, root, ignore) {
  await page.addScriptTag({ url: AXE });
  const res = await page.evaluate(
    async ([root, skip]) =>
      (
        await window.axe.run(
          {
            ...(root ? { include: [[root]] } : {}),
            exclude: skip.map((s) => [s]),
          },
          { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
        )
      ).violations,
    [root, [...DEV_OVERLAYS.split(","), ...ignore]],
  );
  return res.map((v) => ({
    rule: `axe.${v.id}`,
    severity:
      v.impact === "critical" || v.impact === "serious" ? "FAIL" : "WARN",
    selector: v.nodes
      .map((n) => n.target.join(" "))
      .slice(0, 3)
      .join(", "),
    measured: `${v.nodes.length} node(s)`,
    norm: v.helpUrl,
    message: v.help,
  }));
}

// Put the page in a theme the way the app does it: the persisted theme store
// (localStorage "theme-storage", read on load by ThemeProvider), the media query, then the
// classes and color-scheme for pages without the store (pistes pages, fixtures).
async function applyTheme(page, theme) {
  const dark = theme === "dark";
  await page.emulateMedia({ colorScheme: dark ? "dark" : "light" });
  const stored = await page.evaluate((t) => {
    try {
      localStorage.setItem(
        "theme-storage",
        JSON.stringify({ state: { theme: t }, version: 0 }),
      );
      return true;
    } catch {
      return false;
    }
  }, theme);
  if (stored && /^https?:/.test(page.url())) {
    await page.reload({ waitUntil: "networkidle" });
    await waitForApp(page);
    await page.addStyleTag({
      content: `${DEV_OVERLAYS}{display:none!important}`,
    });
  }
  await page.evaluate((isDark) => {
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(isDark ? "dark" : "light");
    html.style.colorScheme = isDark ? "dark" : "light";
    if (html.hasAttribute("data-theme"))
      html.dataset.theme = isDark ? "dark" : "light";
  }, dark);
  await settle(page);
}

export class UsageError extends Error {}

export async function runAudit(o) {
  const browser = await chromium.launch();
  const runs = [];
  // One context for every width: a rotated session cookie stays valid across the whole run.
  const context = await browser.newContext({
    viewport: { width: o.widths[0], height: 900 },
    storageState: o.storage || undefined,
  });
  try {
    const page = await context.newPage();
    trackNetwork(page);
    await openApp(page, o.url);
    if (!(await page.$(o.root)))
      throw new UsageError(`--root ${o.root} matches nothing on ${o.url}.`);
    // Dev-only overlays never ship: remove them so they don't skew layout or focus checks.
    await page.addStyleTag({
      content: `${DEV_OVERLAYS}{display:none!important}`,
    });
    await settle(page);
    // A pistes page shows one piste at a time: audit each in turn.
    const pistes = await page.$$eval(".piste[data-piste]", (els) =>
      els.map((e) => e.dataset.piste),
    );
    for (const width of o.widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of o.themes) {
        await applyTheme(page, theme);
        checkSession(page, o.url);
        for (const piste of pistes.length ? pistes : [null]) {
          if (piste) {
            await page.evaluate((id) => {
              document.documentElement.dataset.layout = "focus";
              document
                .querySelectorAll(".piste")
                .forEach((p) =>
                  p.toggleAttribute("data-current", p.dataset.piste === id),
                );
            }, piste);
            await settle(page);
          }
          await page.addScriptTag({ path: AUDIT });
          const r = await page.evaluate(
            ([root, ignore]) => window.__talkupAudit({ root, ignore }),
            [o.root, o.ignore],
          );
          if (o.focus) r.findings.push(...(await focusFindings(page)));
          r.findings.push(...(await reducedMotionFindings(page)));
          if (o.axe)
            r.findings.push(...(await axeFindings(page, o.root, o.ignore)));
          runs.push({
            url: o.url,
            width,
            theme,
            ...(piste ? { piste } : {}),
            findings: r.findings,
          });
        }
      }
    }
  } finally {
    // Sessions rotate on use: keep the newest one for the next capture or audit.
    if (o.storage)
      await saveSession(context, o.storage).catch(warnSaveFailed(o.storage));
    await browser.close();
  }
  return runs;
}

function print(runs) {
  for (const run of runs) {
    const counts = ["FAIL", "WARN", "NOTE"]
      .map((s) => `${run.findings.filter((f) => f.severity === s).length} ${s}`)
      .join(", ");
    console.log(
      `\n== ${run.url} · ${run.width}px · ${run.theme}${run.piste ? ` · piste ${run.piste}` : ""} — ${counts}`,
    );
    for (const f of run.findings)
      console.log(
        `  [${f.severity}] ${f.rule}: ${f.message}${f.selector ? `  (${f.selector})` : ""}`,
      );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const o = parseArgs(process.argv.slice(2));
  if (!o.url) {
    console.error(
      "usage: node run-audit.mjs <url> [--themes light,dark] [--width 1440,390] [--root sel] [--ignore sel,sel] [--axe] [--no-focus] [--storage <state file>] [--json]",
    );
    process.exit(2);
  }
  let runs;
  try {
    runs = await runAudit(o);
  } catch (e) {
    if (e instanceof UsageError) {
      console.error(e.message);
      process.exit(2);
    }
    if (!(e instanceof SessionExpired)) throw e;
    console.error(e.message);
    process.exit(3);
  }
  if (o.json) console.log(JSON.stringify(runs, null, 2));
  else print(runs);
  process.exit(
    runs.some((r) => r.findings.some((f) => f.severity === "FAIL")) ? 1 : 0,
  );
}
