import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { saveSession } from "../session.mjs";

const state = { cookies: [{ name: "session", value: "1" }], origins: [] };
// Like Playwright's BrowserContext: storageState() without a path returns the state.
const fakeContext = {
  storageState: async (opts) => {
    if (opts?.path) throw new Error("must not let Playwright write the file");
    return state;
  },
};
const tmp = async () =>
  join(await mkdtemp(join(tmpdir(), "talkup-session-")), "state.json");

test("saveSession writes a new state readable by its owner only", async () => {
  const path = await tmp();
  await saveSession(fakeContext, path);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  assert.deepEqual(JSON.parse(await readFile(path, "utf8")), state);
});

test("saveSession tightens an existing state file", async () => {
  const path = await tmp();
  await writeFile(path, "{}", { mode: 0o644 });
  await saveSession(fakeContext, path);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  assert.deepEqual(JSON.parse(await readFile(path, "utf8")), state);
});
