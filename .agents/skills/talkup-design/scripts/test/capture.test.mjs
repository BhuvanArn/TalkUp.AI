import { execFile } from "node:child_process";
import { mkdtemp, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const CAPTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "capture.mjs",
);
const run = promisify(execFile);

const png = async (file) => {
  const b = Buffer.from(
    await (await import("node:fs/promises")).readFile(file),
  );
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

test("captures a region in dark without dev overlays", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cap-"));
  const page = join(dir, "p.html");
  await writeFile(
    page,
    `<!doctype html><html><head><style>body{margin:0}.box{width:300px;height:120px;background:#fff}.dark .box{background:#17253f}
    .TanStackRouterDevtools{position:fixed;top:0;left:0;width:300px;height:120px;background:red}</style></head>
    <body><div class="box" id="hero"></div><footer class="TanStackRouterDevtools"></footer></body></html>`,
  );
  const out = join(dir, "context.png");
  await run(process.execPath, [
    CAPTURE,
    pathToFileURL(page).href,
    "--out",
    out,
    "--theme",
    "dark",
    "--width",
    "800",
    "--clip",
    "#hero",
  ]);
  assert.deepEqual(await png(out), { w: 300, h: 120 });
  assert.ok((await stat(out)).size > 0);
});

test("captures one piste of a pistes page in English and dark", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cap-"));
  const page = join(dir, "p.html");
  await writeFile(
    page,
    `<!doctype html><html data-lang="fr" data-theme="light" data-layout="focus"><head><style>
    body{margin:0} .piste{display:none} .piste[data-current]{display:block;width:200px;height:50px}
    [data-theme='dark'] .piste{background:#000} html[data-lang='fr'] [data-lang='en']:not(html){display:none}</style></head>
    <body><section class="piste" data-piste="A" data-current></section><section class="piste" data-piste="B"><span data-lang="en">EN</span></section></body></html>`,
  );
  const out = join(dir, "b.png");
  const { stdout } = await run(process.execPath, [
    CAPTURE,
    pathToFileURL(page).href,
    "--out",
    out,
    "--theme",
    "dark",
    "--lang",
    "en",
    "--piste",
    "B",
    "--clip",
    '[data-piste="B"]',
    "--report",
  ]);
  const state = JSON.parse(stdout.trim().split("\n").pop());
  assert.deepEqual(state, {
    theme: "dark",
    lang: "en",
    piste: "B",
    storeTheme: "dark",
    hidden: 0,
  });
  assert.deepEqual(await png(out), { w: 200, h: 50 });
});

test("clicks before capturing and hides extra selectors", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cap-"));
  const page = join(dir, "tabs.html");
  await writeFile(
    page,
    `<!doctype html><html><head><style>body{margin:0} #panel{display:none;width:120px;height:40px} #panel.on{display:block} .fab{position:fixed;right:0;top:0}</style></head>
    <body><button id="tab" onclick="document.querySelector('#panel').classList.add('on')">Talking points</button><div id="panel"></div><button class="fab">Chat</button></body></html>`,
  );
  const out = join(dir, "p.png");
  const { stdout } = await run(process.execPath, [
    CAPTURE,
    pathToFileURL(page).href,
    "--out",
    out,
    "--click",
    "#tab",
    "--hide",
    ".fab",
    "--clip",
    "#panel",
    "--report",
  ]);
  assert.deepEqual(await png(out), { w: 120, h: 40 });
  assert.match(stdout, /"hidden":1/);
});
