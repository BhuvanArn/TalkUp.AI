import { chromium } from "@playwright/test";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { extractTokens, tokensToCss } from "../tokens.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const REPO = join(here, "..", "..", "..", "..", "..");
const TAILWIND = join(REPO, "web", "src", "styles", "tailwind.css");
const NEW = join(here, "..", "new-pistes.mjs");
const AUDIT = join(here, "..", "audit.js");
const run = promisify(execFile);

const valueIn = (css, blockStart, name) => {
  const block = css.slice(css.indexOf(blockStart));
  return new RegExp(`${name}:\\s*([^;]+);`).exec(block)[1].trim();
};

test("extractTokens reads light, dark and organization values from tailwind.css", async () => {
  const css = await readFile(TAILWIND, "utf8");
  const t = extractTokens(css);
  assert.equal(
    t.light["--color-accent"],
    valueIn(css, "@theme {", "--color-accent"),
  );
  assert.equal(
    t.dark["--color-background"],
    valueIn(css, ".dark {", "--color-background"),
  );
  assert.equal(
    t.org["--color-accent"],
    valueIn(css, ":root[data-view='organization'] {", "--color-accent"),
  );
  assert.equal(
    t.orgDark["--color-accent"],
    valueIn(css, ":root.dark[data-view='organization'] {", "--color-accent"),
  );
  assert.ok(t.light["--font-display"].includes("Saira"));
  assert.match(t.utilities, /\.text-h1\s*\{/);
  assert.doesNotMatch(t.utilities, /bg-brand-gradient/);
});

test("tokensToCss scopes themes on html attributes", () => {
  const css = tokensToCss({
    light: { "--a": "1" },
    dark: { "--a": "2" },
    org: { "--a": "3" },
    orgDark: { "--a": "4" },
    utilities: "",
  });
  assert.match(css, /:root\s*\{[^}]*--a: 1;/);
  assert.match(css, /\[data-theme='dark'\]\s*\{[^}]*--a: 2;/);
  assert.match(css, /\[data-view='organization'\]\s*\{[^}]*--a: 3;/);
  assert.match(
    css,
    /\[data-theme='dark'\]\[data-view='organization'\]\s*\{[^}]*--a: 4;/,
  );
});

async function newPistes(dir, ...args) {
  return run(process.execPath, [NEW, ...args, "--out", dir]).catch((e) => e);
}

test("new-pistes creates page with tokens", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pistes-"));
  const r = await newPistes(
    dir,
    "back-link",
    "--title",
    "Lien retour",
    "--count",
    "2",
  );
  assert.equal(r.code ?? 0, 0, r.stderr);
  const html = await readFile(join(dir, "back-link", "index.html"), "utf8");
  assert.match(html, /--color-accent:/);
  assert.match(html, /<title>Lien retour<\/title>/);
  assert.equal((html.match(/data-piste="/g) || []).length, 2);
});

test("new-pistes refuses overwrite", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pistes-"));
  await newPistes(dir, "x", "--title", "X");
  const r = await newPistes(dir, "x", "--title", "X");
  assert.equal(r.code, 1);
  assert.match(r.stderr, /exists/);
});

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
});

test("template keyboard controls and audit", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pistes-"));
  await newPistes(dir, "kbd", "--title", "Clavier", "--count", "3");
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(pathToFileURL(join(dir, "kbd", "index.html")).href);
  // Opens one piste at a time, full width; V switches to side by side.
  assert.ok(await p.isVisible('[data-piste="A"]'));
  assert.ok(!(await p.isVisible('[data-piste="B"]')));
  await p.keyboard.press("ArrowRight");
  assert.ok(await p.isVisible('[data-piste="B"]'));
  assert.ok(!(await p.isVisible('[data-piste="A"]')));
  await p.keyboard.press("v");
  assert.ok(await p.isVisible('[data-piste="A"]'));
  assert.ok(await p.isVisible('[data-piste="C"]'));
  await p.keyboard.press("v");
  await p.keyboard.press("t");
  assert.equal(await p.getAttribute("html", "data-theme"), "dark");
  await p.keyboard.press("l");
  assert.equal(await p.getAttribute("html", "data-lang"), "en");
  assert.ok(
    !(await p.locator('[data-piste="B"] [data-lang="fr"]').first().isVisible()),
  );
  assert.ok(
    await p.locator('[data-piste="B"] [data-lang="en"]').first().isVisible(),
  );
  await p.addScriptTag({ path: AUDIT });
  for (const theme of ["light", "dark"]) {
    await p.evaluate(
      (t) => document.documentElement.setAttribute("data-theme", t),
      theme,
    );
    const r = await p.evaluate(() => window.__talkupAudit({ root: ".chrome" }));
    assert.deepEqual(
      r.findings.filter((f) => f.severity === "FAIL"),
      [],
      `${theme}: ${JSON.stringify(r.findings)}`,
    );
  }
  await p.close();
});

test("page asks for a recommendation, blocking questions and measured states", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pistes-"));
  await newPistes(dir, "slots", "--title", "Slots", "--count", "2");
  const html = await readFile(join(dir, "slots", "index.html"), "utf8");
  assert.match(html, /<h3[^>]*>Recommandation<\/h3>/);
  assert.match(html, /<h3[^>]*>Questions bloquantes<\/h3>/);
  assert.equal((html.match(/<dt>États et mesures<\/dt>/g) || []).length, 2);
  const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
  assert.doesNotMatch(header, /·/);
  const d = new Date();
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  assert.match(header, new RegExp(local));
});
