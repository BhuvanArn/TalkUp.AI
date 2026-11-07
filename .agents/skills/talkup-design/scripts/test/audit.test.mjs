import { chromium } from "@playwright/test";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const here = dirname(fileURLToPath(import.meta.url));
const AUDIT = join(here, "..", "audit.js");
const CLI = join(here, "..", "run-audit.mjs");

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
});

const page = (body, css = "") => `<!doctype html><html><head><style>
  body { margin: 0; padding: 32px; font: 16px/1.5 sans-serif; color: #24242d; background: #fff; }
  label { display: block; font-size: 14px; line-height: 20px; }
  input { display: block; box-sizing: border-box; height: 40px; width: 280px; font-size: 16px;
          border: 1px solid #6b6b78; margin: 0; }
  label + input { margin-top: 8px; }
  button { height: 40px; padding: 0 16px; font-size: 16px; margin: 0; }
  ${css}
</style></head><body>${body}</body></html>`;

const form = (fieldGap, buttonGap) =>
  page(`<form>
    <div class="f"><label for="email">Email</label><input id="email"></div>
    <div class="f" style="margin-top:${fieldGap}px"><label for="password">Password</label><input id="password" type="password"></div>
    <button type="submit" style="margin-top:${buttonGap}px">Log in</button>
  </form>`);

async function audit(html, options) {
  const p = await browser.newPage();
  await p.setContent(html);
  await p.addScriptTag({ path: AUDIT });
  const result = await p.evaluate(
    (o) => window.__talkupAudit(o),
    options ?? {},
  );
  await p.close();
  return result;
}

const byRule = (r, rule) => r.findings.filter((f) => f.rule === rule);

test("flags 24px field gap", async () => {
  const r = await audit(form(24, 32));
  const f = byRule(r, "form.field-gap");
  assert.equal(f.length, 1);
  assert.equal(f[0].measured, "24px");
  assert.equal(f[0].severity, "WARN");
  assert.match(f[0].message, /norm 16–20px/);
});

test("accepts 16px field gap and 32px button gap", async () => {
  const r = await audit(form(16, 32));
  assert.deepEqual(
    r.findings.filter((f) => f.rule.startsWith("form.")),
    [],
  );
});

test("flags button closer than field gap", async () => {
  const r = await audit(form(16, 8));
  assert.equal(byRule(r, "form.button-gap").length, 1);
});

test("flags low text contrast", async () => {
  const r = await audit(page('<p style="color:#a4a4b2">Secondary text</p>'));
  const f = byRule(r, "contrast.text");
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, "FAIL");
  assert.match(f[0].measured, /^2\.\d:1$/);
});

test("resolves background through ancestors", async () => {
  const r = await audit(
    page(
      '<div style="background:#17253f;padding:16px"><p><span style="color:#90b8f0">Pastel on navy</span></p></div>',
    ),
  );
  assert.deepEqual(byRule(r, "contrast.text"), []);
});

test("parses oklch colors", async () => {
  const r = await audit(page('<p style="color:oklch(0.8 0 0)">Light grey</p>'));
  const f = byRule(r, "contrast.text");
  assert.equal(f.length, 1);
  assert.ok(!f[0].measured.includes("NaN"));
});

test("ignores hidden elements", async () => {
  const r = await audit(
    page(`<p style="display:none;color:#eee">a</p><p style="visibility:hidden;color:#eee">b</p>
          <p aria-hidden="true" style="color:#eee">c</p><p style="color:#eee;width:0;height:0;overflow:hidden">d</p>`),
  );
  assert.deepEqual(byRule(r, "contrast.text"), []);
});

test("lone small target warns", async () => {
  const r = await audit(
    page('<button style="width:16px;height:16px;padding:0">x</button>'),
  );
  const f = byRule(r, "target.size");
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, "WARN");
});

test("flags input border below 3:1", async () => {
  const r = await audit(
    page('<label for="a">A</label><input id="a" style="border-color:#d9dbeb">'),
  );
  assert.equal(byRule(r, "contrast.non-text").length, 1);
});

test("reports theme", async () => {
  const r = await audit(
    page("<p>Hi</p>").replace("<html>", '<html class="dark">'),
  );
  assert.equal(r.theme, "dark");
});

test("audits both themes", async () => {
  const dir = await mkdtemp(join(tmpdir(), "talkup-audit-"));
  const file = join(dir, "themes.html");
  await writeFile(
    file,
    page(
      '<p class="t">Theme text</p>',
      ".t{color:#24242d} .dark body{background:#17253f} .dark .t{color:#2a3550}",
    ),
  );
  const { stdout } = await promisify(execFile)(process.execPath, [
    CLI,
    pathToFileURL(file).href,
    "--themes",
    "light,dark",
    "--width",
    "1440",
    "--json",
  ]).catch((e) => e);
  const runs = JSON.parse(stdout);
  const light = runs.find((x) => x.theme === "light");
  const dark = runs.find((x) => x.theme === "dark");
  assert.ok(light && dark);
  assert.equal(
    light.findings.filter((f) => f.rule === "contrast.text").length,
    0,
  );
  assert.equal(
    dark.findings.filter((f) => f.rule === "contrast.text").length,
    1,
  );
});

test("skips TanStack devtools and ignore option", async () => {
  const r = await audit(
    page(`<footer class="TanStackRouterDevtools"><p style="color:#eee">dev</p></footer>
          <div class="tsqd-parent-container"><button style="width:8px;height:8px;padding:0">q</button></div>
          <div class="mine"><p style="color:#eee">skip me</p></div>`),
    { ignore: [".mine"] },
  );
  assert.deepEqual(
    r.findings.filter(
      (f) => f.rule === "contrast.text" || f.rule === "target.size",
    ),
    [],
  );
});

test("applies target spacing exception", async () => {
  const r = await audit(
    page(
      '<p>Text</p><a href="#" style="display:block;width:200px;line-height:20px;margin-top:24px">Forgot your password?</a>',
    ),
  );
  const f = byRule(r, "target.size");
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, "WARN");
});

test("crowded small targets still fail", async () => {
  const r = await audit(
    page(
      '<div style="display:flex;gap:4px"><button style="width:16px;height:6px;padding:0"></button><button style="width:16px;height:6px;padding:0"></button></div>',
    ),
  );
  assert.ok(byRule(r, "target.size").every((f) => f.severity === "FAIL"));
  assert.equal(byRule(r, "target.size").length, 2);
});

test("flags placeholder-only fields", async () => {
  const r = await audit(
    page(
      '<form><input id="email" placeholder="Email"><button>Go</button></form>',
    ),
  );
  const f = byRule(r, "form.placeholder-label");
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, "WARN");
});

test("aria-label does not replace a visible label", async () => {
  const r = await audit(
    page(
      '<form><input id="email" aria-label="email" placeholder="Email"><button>Go</button></form>',
    ),
  );
  assert.equal(byRule(r, "form.placeholder-label").length, 1);
});

test("waits for theme transitions before measuring", async () => {
  const dir = await mkdtemp(join(tmpdir(), "talkup-audit-"));
  const file = join(dir, "transition.html");
  // A colour transition like the app's theme switch: mid-way, grey text sits on grey.
  await writeFile(
    file,
    page(
      '<p class="t">Theme text</p>',
      "body,.t{transition:color 0.5s linear,background-color 0.5s linear} .t{color:#24242d} .dark body{background:#17253f} .dark .t{color:#e8ecf6}",
    ),
  );
  const { stdout } = await promisify(execFile)(process.execPath, [
    CLI,
    pathToFileURL(file).href,
    "--themes",
    "dark",
    "--width",
    "1440",
    "--json",
    "--no-focus",
  ]).catch((e) => e);
  const dark = JSON.parse(stdout).find((x) => x.theme === "dark");
  assert.deepEqual(
    dark.findings.filter((f) => f.rule === "contrast.text"),
    [],
  );
});

const SR_ONLY =
  "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)";

test("sr-only label is not a visible label", async () => {
  const r = await audit(
    page(
      `<form><label for="d" style="${SR_ONLY}">Interview date</label><input id="d" placeholder="Interview date"><button>Go</button></form>`,
    ),
  );
  assert.deepEqual(byRule(r, "form.label-input-gap"), []);
  assert.equal(byRule(r, "form.placeholder-label").length, 1);
});

test("borderless input is judged by its bordered wrapper", async () => {
  const wrap = (border) =>
    page(`<div style="background:#f8f9ff;padding:24px"><div class="w" style="border:1px solid ${border};padding:12px 16px">
      <input id="u" style="border:0;background:transparent;height:21px" placeholder="https://…"></div></div>`);
  const low = byRule(await audit(wrap("#d9dbeb")), "contrast.non-text");
  assert.equal(low.length, 1);
  assert.match(low[0].measured, /^1\.\d:1$/);
  assert.deepEqual(
    byRule(await audit(wrap("#6b6b78")), "contrast.non-text"),
    [],
  );
});

test("flags horizontal page overflow", async () => {
  const r = await audit(page('<div style="width:2000px">wide</div>'));
  assert.equal(byRule(r, "layout.overflow").length, 1);
});

test("flags clipped text but not ellipsis", async () => {
  const r = await audit(
    page(`<p id="cut" style="width:80px;white-space:nowrap;overflow:hidden">Ingénieur logiciel backend (Go)</p>
          <p id="ell" style="width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Ingénieur logiciel backend (Go)</p>`),
  );
  const f = byRule(r, "layout.clipped-text");
  assert.deepEqual(
    f.map((x) => x.selector),
    ["#cut"],
  );
});

test("flags content cut off by a clipping ancestor", async () => {
  const r = await audit(
    page(
      `<div id="canvas" style="width:300px;overflow:hidden"><div id="phone" style="width:420px"><p id="t">Envoyez-moi le lien par e-mail</p></div></div>`,
    ),
  );
  assert.equal(byRule(r, "layout.clipped-text").length, 1);
});

test("audits every piste of a pistes page", async () => {
  const dir = await mkdtemp(join(tmpdir(), "talkup-audit-"));
  const file = join(dir, "pistes.html");
  await writeFile(
    file,
    page(
      `<section class="piste" data-piste="A" data-current><p>Readable</p></section>
       <section class="piste" data-piste="B"><p style="color:#c8c8d4">Too light</p></section>`,
      ".piste{display:none} .piste[data-current]{display:block}",
    ),
  );
  const { stdout } = await promisify(execFile)(process.execPath, [
    CLI,
    pathToFileURL(file).href,
    "--themes",
    "light",
    "--width",
    "1440",
    "--json",
    "--no-focus",
  ]).catch((e) => e);
  const runs = JSON.parse(stdout);
  assert.deepEqual(
    runs.map((r) => r.piste),
    ["A", "B"],
  );
  assert.equal(
    runs
      .find((r) => r.piste === "B")
      .findings.filter((f) => f.rule === "contrast.text").length,
    1,
  );
});

test("scrollable rows and sr-only text are not clipped text", async () => {
  const r = await audit(
    page(`<div style="width:300px;overflow-x:auto"><div style="width:900px"><p>Kanban column far right</p></div></div>
          <label for="d" style="${SR_ONLY}">Interview date</label><input id="d">`),
  );
  assert.deepEqual(byRule(r, "layout.clipped-text"), []);
});

test("dev overlays do not count as page overflow", async () => {
  const dir = await mkdtemp(join(tmpdir(), "talkup-audit-"));
  const file = join(dir, "devtools.html");
  await writeFile(
    file,
    page(
      '<p>Fits</p><footer class="TanStackRouterDevtools"><div style="width:2000px">devtools</div></footer>',
    ),
  );
  const { stdout } = await promisify(execFile)(process.execPath, [
    CLI,
    pathToFileURL(file).href,
    "--themes",
    "light",
    "--width",
    "390",
    "--json",
    "--no-focus",
  ]).catch((e) => e);
  assert.deepEqual(
    JSON.parse(stdout)[0].findings.filter((f) => f.rule === "layout.overflow"),
    [],
  );
});
