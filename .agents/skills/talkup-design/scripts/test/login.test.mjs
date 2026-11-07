import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const here = dirname(fileURLToPath(import.meta.url));
const LOGIN = join(here, "..", "login.mjs");
const CAPTURE = join(here, "..", "capture.mjs");
const run = promisify(execFile);

// A tiny app: /login form → POST /session sets a cookie → /app needs it, else redirects to /login.
let server;
let base;
before(async () => {
  server = createServer((req, res) => {
    const authed = /session=ok/.test(req.headers.cookie || "");
    if (req.url === "/login") {
      res.setHeader("content-type", "text/html");
      return res.end(
        '<form method="post" action="/session"><input id="email" name="email"><input id="password" name="password" type="password"><button>Log in</button></form>',
      );
    }
    if (req.url === "/session" && req.method === "POST") {
      res.writeHead(303, {
        "set-cookie": "session=ok; Path=/",
        location: "/app",
      });
      return res.end();
    }
    if (req.url === "/app") {
      if (!authed) {
        res.writeHead(302, { location: "/login" });
        return res.end();
      }
      res.setHeader("content-type", "text/html");
      return res.end('<main id="app">Signed in</main>');
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test("login saves a storage state with the session cookie", async () => {
  const out = join(await mkdtemp(join(tmpdir(), "login-")), "state.json");
  await run(process.execPath, [
    LOGIN,
    base,
    "--email",
    "qa@talkup.ai",
    "--password",
    "x",
    "--out",
    out,
  ]);
  const state = JSON.parse(await readFile(out, "utf8"));
  assert.ok(
    state.cookies.some((c) => c.name === "session" && c.value === "ok"),
  );
});

test("capture fails loudly when the session sends it to /login", async () => {
  const out = join(await mkdtemp(join(tmpdir(), "cap-")), "x.png");
  const r = await run(process.execPath, [
    CAPTURE,
    `${base}/app`,
    "--out",
    out,
  ]).catch((e) => e);
  assert.equal(r.code, 3);
  assert.match(r.stderr, /login\.mjs/);
});
