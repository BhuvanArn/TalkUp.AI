#!/usr/bin/env node
// Run the TalkUp design audit on a page, in each theme and width.
//
//   node run-audit.mjs <url> [--themes light,dark] [--width 1440,390] [--root main]
//                      [--ignore sel,sel] [--axe] [--no-focus] [--storage state.json] [--json]
//
// Needs @playwright/test (repo devDependency) and Chromium (`npx playwright install chromium`).
// Theme switch = toggling the `dark` class on <html>, like the app's theme store.
// --storage reuses a Playwright storage state (cookies) for signed-in pages.
// Exit code 1 when any FAIL finding exists.
import { chromium } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AUDIT = join(dirname(fileURLToPath(import.meta.url)), 'audit.js');
const DEV_OVERLAYS = '.TanStackRouterDevtools,.tsqd-parent-container,[data-talkup-audit-ignore]';
const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';

function parseArgs(argv) {
  const o = { themes: ['light', 'dark'], widths: [1440, 390], root: 'body', ignore: [], axe: false, focus: true, json: false, storage: null };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--themes') o.themes = argv[++i].split(',');
    else if (a === '--width') o.widths = argv[++i].split(',').map(Number);
    else if (a === '--root') o.root = argv[++i];
    else if (a === '--storage') o.storage = argv[++i];
    else if (a === '--ignore') o.ignore = argv[++i].split(',');
    else if (a === '--axe') o.axe = true;
    else if (a === '--no-focus') o.focus = false;
    else if (a === '--json') o.json = true;
    else rest.push(a);
  }
  o.url = rest[0];
  return o;
}

async function focusFindings(page, max = 60) {
  const out = [];
  const seen = new Set();
  await page.evaluate(() => document.activeElement?.blur());
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate((skip) => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      if (el.closest(skip)) return { id: '__skip__' + Math.random(), visible: true };
      const s = getComputedStyle(el);
      const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
      const shadow = s.boxShadow && s.boxShadow !== 'none';
      const id = el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}:${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}`;
      return { id, visible: outline || shadow };
    }, DEV_OVERLAYS);
    if (!r || seen.has(r.id)) {
      if (r && seen.has(r.id)) break; // wrapped around
      continue;
    }
    seen.add(r.id);
    if (!r.visible)
      out.push({ rule: 'focus.missing', severity: 'FAIL', selector: r.id, measured: 'no outline or ring', norm: 'visible focus, ≥2px, ≥3:1', message: `${r.id} shows no focus indicator when reached with Tab.` });
  }
  return out;
}

async function reducedMotionFindings(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const n = await page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).length,
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return n
    ? [{ rule: 'motion.reduced', severity: 'WARN', selector: '', measured: `${n} infinite animation(s)`, norm: 'none under prefers-reduced-motion', message: `${n} looping animation(s) keep running with prefers-reduced-motion: reduce.` }]
    : [];
}

async function axeFindings(page) {
  await page.addScriptTag({ url: AXE });
  const res = await page.evaluate(async (skip) => (await window.axe.run({ exclude: skip.split(',').map((s) => [s]) }, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] })).violations, DEV_OVERLAYS);
  return res.map((v) => ({ rule: `axe.${v.id}`, severity: v.impact === 'critical' || v.impact === 'serious' ? 'FAIL' : 'WARN', selector: v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', '), measured: `${v.nodes.length} node(s)`, norm: v.helpUrl, message: v.help }));
}

export async function runAudit(o) {
  const browser = await chromium.launch();
  const runs = [];
  try {
    for (const width of o.widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, storageState: o.storage || undefined });
      const page = await context.newPage();
      await page.goto(o.url, { waitUntil: 'networkidle' });
      for (const theme of o.themes) {
        await page.evaluate((t) => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
        await page.waitForTimeout(150);
        await page.addScriptTag({ path: AUDIT });
        const r = await page.evaluate(([root, ignore]) => window.__talkupAudit({ root, ignore }), [o.root, o.ignore]);
        if (o.focus) r.findings.push(...(await focusFindings(page)));
        r.findings.push(...(await reducedMotionFindings(page)));
        if (o.axe) r.findings.push(...(await axeFindings(page)));
        runs.push({ url: o.url, width, theme, findings: r.findings });
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return runs;
}

function print(runs) {
  for (const run of runs) {
    const counts = ['FAIL', 'WARN', 'NOTE'].map((s) => `${run.findings.filter((f) => f.severity === s).length} ${s}`).join(', ');
    console.log(`\n== ${run.url} · ${run.width}px · ${run.theme} — ${counts}`);
    for (const f of run.findings) console.log(`  [${f.severity}] ${f.rule}: ${f.message}${f.selector ? `  (${f.selector})` : ''}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const o = parseArgs(process.argv.slice(2));
  if (!o.url) {
    console.error('usage: node run-audit.mjs <url> [--themes light,dark] [--width 1440,390] [--root sel] [--ignore sel,sel] [--axe] [--no-focus] [--storage state.json] [--json]');
    process.exit(2);
  }
  const runs = await runAudit(o);
  if (o.json) console.log(JSON.stringify(runs, null, 2));
  else print(runs);
  process.exit(runs.some((r) => r.findings.some((f) => f.severity === 'FAIL')) ? 1 : 0);
}
