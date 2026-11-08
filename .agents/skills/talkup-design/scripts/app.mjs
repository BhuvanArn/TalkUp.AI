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

// Requests in flight per page, counted from creation (call right after newPage).
const network = new WeakMap();
export function trackNetwork(page) {
  const s = { inflight: 0, last: Date.now() };
  const up = () => {
    s.inflight += 1;
    s.last = Date.now();
  };
  const down = () => {
    s.inflight = Math.max(0, s.inflight - 1);
    s.last = Date.now();
  };
  page.on("request", up);
  page.on("requestfinished", down);
  page.on("requestfailed", down);
  network.set(page, s);
}

// "networkidle" fires before the app's first auth call: the SPA draws nothing until
// /auth/status and /users/me answer, or redirects to /login. Wait for visible text (across
// navigations), then for 500 ms without requests in flight. A page with no text at all
// just costs the timeout.
export async function waitForApp(page, timeout = 10000) {
  const deadline = Date.now() + timeout;
  const left = () => Math.max(1, deadline - Date.now());
  while (Date.now() < deadline) {
    try {
      await page.waitForFunction(
        () => (document.body?.innerText || "").trim().length > 0,
        null,
        { timeout: left() },
      );
      break;
    } catch (e) {
      // A navigation (redirect) destroys the context: wait on the new page.
      if (!/destroyed|navigat/i.test(e.message)) break;
    }
  }
  const s = network.get(page);
  while (s && Date.now() < deadline) {
    if (s.inflight === 0 && Date.now() - s.last >= 500) break;
    await page.waitForTimeout(100);
  }
  await page.waitForLoadState("load").catch(() => {});
}

// Navigate, let the app render, then fail fast on an expired session.
export async function openApp(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await waitForApp(page);
  checkSession(page, url);
}
