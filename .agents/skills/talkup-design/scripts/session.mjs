// Save a Playwright storage state (a live session) readable by its owner only: it holds
// auth cookies and lives in a shared temp folder. The file is created 0600 (never briefly
// world-readable); chmod covers a file that already existed with wider rights.
import { chmod, writeFile } from "node:fs/promises";

export async function saveSession(context, path) {
  const state = await context.storageState();
  await writeFile(path, JSON.stringify(state, null, 2), { mode: 0o600 });
  await chmod(path, 0o600);
}

// For the save-back after a run: a failure must not hide the run's result, but must show.
export const warnSaveFailed = (path) => (e) =>
  console.error(`Could not save the session to ${path}: ${e.message}`);
