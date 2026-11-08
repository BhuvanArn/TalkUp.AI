// CLI behaviour against a small HTTP app: theme store, session rotation, focus transitions.
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const here = dirname(fileURLToPath(import.meta.url));
const AUDIT = join(here, "..", "run-audit.mjs");
const run = promisify(execFile);

const STYLE =
  "<style>body{margin:0;padding:32px;font:16px/1.5 sans-serif;background:#fff} .dark body{background:#17253f}</style>";
// Like the app: a JS theme store in localStorage decides the text colour (not CSS alone).
const THEMED = `<!doctype html><html><head>${STYLE}</head><body><p id="t">Themed by JS</p><script>
  const t = JSON.parse(localStorage.getItem('theme-storage') || '{"state":{"theme":"light"}}').state.theme;
  document.documentElement.classList.add(t);
  document.getElementById('t').style.color = t === 'dark' ? '#e8ecf6' : '#24242d';
</script></body></html>`;
const FOCUS = `<!doctype html><html><head>${STYLE}<style>button{outline:0 solid #2b70c9;transition:all .3s}button:focus-visible{outline-width:2px}</style></head><body><button>One</button><button>Two</button></body></html>`;

// Two controls share a label: the Tab walk must not take the second for a wrap-around.
const FOCUS_DUPES = `<!doctype html><html><head>${STYLE}<style>button:focus-visible{outline:2px solid #2b70c9}#bare{outline:none}</style></head><body><button>Edit</button><button>Edit</button><button id="bare">Last</button></body></html>`;

// Like the app: nothing is drawn until an auth call made after load (past networkidle).
const LATE = `<!doctype html><html><head>${STYLE}</head><body><script>
  setTimeout(() => { document.body.innerHTML = '<p style="color:#ddd">Late text</p>'; }, 900);
</script></body></html>`;
const LATE_REDIRECT = `<!doctype html><html><head>${STYLE}</head><body><script>
  setTimeout(() => { location.href = '/login'; }, 900);
</script></body></html>`;

let server;
let base;
let session = 1;
before(async () => {
  server = createServer((req, res) => {
    if (req.url === "/themed") return res.end(THEMED);
    if (req.url === "/focus") return res.end(FOCUS);
    if (req.url === "/focus-dupes") return res.end(FOCUS_DUPES);
    if (req.url === "/late") return res.end(LATE);
    if (req.url === "/late-redirect") return res.end(LATE_REDIRECT);
    if (req.url === "/app") {
      const m = /session=(\d+)/.exec(req.headers.cookie || "");
      if (!m || Number(m[1]) !== session) {
        res.writeHead(302, { location: "/login" });
        return res.end();
      }
      session += 1; // refresh-token rotation: the old value is now dead
      res.setHeader("set-cookie", `session=${session}; Path=/`);
      return res.end(
        `<!doctype html><html><head>${STYLE}</head><body><p>Signed in</p></body></html>`,
      );
    }
    if (req.url === "/login") return res.end("<p>Log in</p>");
    res.writeHead(404);
    res.end();
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const audit = async (...args) =>
  JSON.parse(
    (await run(process.execPath, [AUDIT, ...args, "--json"]).catch((e) => e))
      .stdout,
  );

test("dark runs go through the app theme store", async () => {
  const runs = await audit(
    `${base}/themed`,
    "--themes",
    "dark",
    "--width",
    "1440",
    "--no-focus",
  );
  assert.deepEqual(
    runs[0].findings.filter((f) => f.rule === "contrast.text"),
    [],
  );
});

test("rotated sessions survive several widths and are saved back", async () => {
  const dir = await mkdtemp(join(tmpdir(), "state-"));
  const state = join(dir, "state.json");
  session = 1;
  const host = new URL(base).hostname;
  await writeFile(
    state,
    JSON.stringify({
      cookies: [
        {
          name: "session",
          value: "1",
          domain: host,
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }),
  );
  const runs = await audit(
    `${base}/app`,
    "--themes",
    "light,dark",
    "--width",
    "1440,390",
    "--storage",
    state,
    "--no-focus",
  );
  assert.equal(runs.length, 4);
  const saved = JSON.parse(await readFile(state, "utf8")).cookies.find(
    (c) => c.name === "session",
  );
  assert.equal(Number(saved.value), session);
});

test("animated focus rings are read once the transition ends", async () => {
  const runs = await audit(
    `${base}/focus`,
    "--themes",
    "light",
    "--width",
    "1440",
  );
  assert.deepEqual(
    runs[0].findings.filter((f) => f.rule === "focus.missing"),
    [],
  );
});

test("capture renders dark through the theme store and saves the rotated session", async () => {
  const CAPTURE = join(here, "..", "capture.mjs");
  const dir = await mkdtemp(join(tmpdir(), "cap-"));
  const out = join(dir, "x.png");
  const r = await run(process.execPath, [
    CAPTURE,
    `${base}/themed`,
    "--out",
    out,
    "--theme",
    "dark",
    "--report",
  ]);
  const report = JSON.parse(r.stdout.trim().split("\n").pop());
  assert.equal(report.storeTheme, "dark");
  const state = join(dir, "state.json");
  session = 1;
  const host = new URL(base).hostname;
  await writeFile(
    state,
    JSON.stringify({
      cookies: [
        {
          name: "session",
          value: "1",
          domain: host,
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }),
  );
  await run(process.execPath, [
    CAPTURE,
    `${base}/app`,
    "--out",
    out,
    "--theme",
    "dark",
    "--storage",
    state,
  ]);
  const saved = JSON.parse(await readFile(state, "utf8")).cookies.find(
    (c) => c.name === "session",
  );
  assert.equal(Number(saved.value), session);
});

test("controls with the same label do not end the focus walk", async () => {
  const runs = await audit(
    `${base}/focus-dupes`,
    "--themes",
    "light",
    "--width",
    "1440",
  );
  assert.deepEqual(
    runs[0].findings
      .filter((f) => f.rule === "focus.missing")
      .map((f) => f.selector),
    ["#bare"],
  );
});

test("the audit waits for an app that renders after networkidle", async () => {
  const runs = await audit(
    `${base}/late`,
    "--themes",
    "light",
    "--width",
    "1440",
    "--no-focus",
  );
  assert.ok(
    runs[0].findings.some((f) => f.rule === "contrast.text"),
    JSON.stringify(runs[0].findings),
  );
});

test("a late redirect to /login exits 3 in audit and capture", async () => {
  const CAPTURE = join(here, "..", "capture.mjs");
  const dir = await mkdtemp(join(tmpdir(), "late-"));
  for (const args of [
    [AUDIT, `${base}/late-redirect`, "--themes", "light", "--width", "1440"],
    [CAPTURE, `${base}/late-redirect`, "--out", join(dir, "x.png")],
  ]) {
    const r = await run(process.execPath, args).catch((e) => e);
    assert.equal(r.code, 3, `${args[0]}: ${r.stderr}`);
    assert.match(r.stderr, /session expired/);
  }
});

test("a --root that matches nothing is a usage error", async () => {
  const r = await run(process.execPath, [
    AUDIT,
    `${base}/focus`,
    "--root",
    "#nope",
    "--themes",
    "light",
    "--width",
    "1440",
  ]).catch((e) => e);
  assert.equal(r.code, 2, r.stderr);
  assert.match(r.stderr, /#nope/);
});
