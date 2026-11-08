import { mkdtemp, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { saveSession } from "../session.mjs";

const fakeContext = {
  storageState: ({ path }) => writeFile(path, "{}", { mode: 0o644 }),
};

test("saveSession writes the state readable by its owner only", async () => {
  const path = join(
    await mkdtemp(join(tmpdir(), "talkup-session-")),
    "state.json",
  );
  await saveSession(fakeContext, path);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
});
