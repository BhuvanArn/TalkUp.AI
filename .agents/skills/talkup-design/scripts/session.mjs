// Save a Playwright storage state (a live session) readable by its owner only:
// it holds auth cookies and lives in a shared temp folder.
import { chmod } from "node:fs/promises";

export async function saveSession(context, path) {
  await context.storageState({ path });
  await chmod(path, 0o600);
}
