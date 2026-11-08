// Helpers shared by capture.mjs and run-audit.mjs, so both treat the app the same way.
// audit.js runs inside the page and cannot import: it keeps its own DEFAULT_IGNORE list.

// Dev-only overlays never ship: hidden so they don't skew captures, layout or focus checks.
export const DEV_OVERLAYS =
  ".TanStackRouterDevtools,.tsqd-parent-container,[data-talkup-audit-ignore]";

// The app animates colours on theme switch: wait for finite animations (3 s at most).
export async function settle(page) {
  await page.waitForTimeout(50);
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      ),
      new Promise((r) => setTimeout(r, 3000)),
    ]),
  );
}

export class SessionExpired extends Error {}

// Signed-in pages redirect to /login when the stored session has expired.
export function checkSession(page, requested) {
  const want = new URL(requested);
  const got = new URL(page.url());
  if (
    want.protocol.startsWith("http") &&
    got.pathname.startsWith("/login") &&
    !want.pathname.startsWith("/login")
  )
    throw new SessionExpired(
      `${requested} redirected to /login: the session expired. Run login.mjs again and retry.`,
    );
}
