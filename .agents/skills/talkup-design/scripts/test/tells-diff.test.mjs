import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const TELLS = join(dirname(fileURLToPath(import.meta.url)), "..", "tells.mjs");

test("--diff sees committed, staged and untracked lines, and skips token blocks", () => {
  const repo = mkdtempSync(join(tmpdir(), "tells-"));
  const git = (...a) =>
    execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@t");
  git("config", "user.name", "t");
  mkdirSync(join(repo, "web/src"), { recursive: true });
  writeFileSync(join(repo, "web/src/a.tsx"), "export const A = 1;\n");
  git("add", ".");
  git("commit", "-qm", "base");
  git("checkout", "-qb", "feature");
  mkdirSync(join(repo, "docs/design/pistes/x"), { recursive: true });
  writeFileSync(
    join(repo, "docs/design/pistes/x/index.html"),
    "<style>\n/* TOKENS:START */\n:root { --c: #2b70c9; }\n/* TOKENS:END */\n.y { color: #ff00aa; }\n</style>\n",
  );
  git("add", ".");
  git("commit", "-qm", "pistes");
  writeFileSync(
    join(repo, "web/src/a.tsx"),
    'export const A = 1;\n<Button className="rounded-full">Go</Button>\n',
  );
  git("add", "web/src/a.tsx"); // staged only
  writeFileSync(
    join(repo, "web/src/b.tsx"),
    '<div className="transition-all" />\n',
  ); // untracked
  const r = spawnSync(process.execPath, [TELLS, "--diff", "main"], {
    cwd: repo,
    encoding: "utf8",
  });
  const ids = [...r.stdout.matchAll(/^(\S+):(\d+)\s+\[([a-z-]+)\]/gm)]
    .map((m) => `${m[1]}:${m[2]}:${m[3]}`)
    .sort();
  assert.deepEqual(ids, [
    "docs/design/pistes/x/index.html:5:hex-literal",
    "web/src/a.tsx:2:pill-button",
    "web/src/b.tsx:1:transition-all",
  ]);
});
