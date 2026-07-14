/**
 * Tracker key used by the global `ThrottlerModule` to bucket rate limits.
 *
 * Hybrid granularity:
 * - **Authenticated requests** are keyed by the resolved user id (`user:<id>`),
 *   so the budget follows the *account* rather than the network. This is what
 *   the per-route limits on authenticated endpoints (e.g. the CV upload and the
 *   LLM-backed application scrape) actually intend: co-located users behind one
 *   NAT no longer share a budget, and a single user can't multiply their budget
 *   by rotating IPs (mobile/VPN).
 * - **Unauthenticated requests** (login / register / OTP, before any JWT is
 *   resolved) fall back to the client IP (`ip:<addr>`). There is no account to
 *   key on yet, so per-IP is the only defensible bucket for the pre-auth
 *   surface.
 *
 * `req.userId` is populated by the auth guards (AccessTokenGuard / SessionGuard)
 * before the ThrottlerGuard runs — provided the auth guard is ordered ahead of
 * the ThrottlerGuard on the route (class-level guard, or listed first in the
 * same `@UseGuards(...)`). If it isn't set, we degrade to the IP bucket rather
 * than dropping all authenticated callers into a single shared key.
 *
 * Keys are namespaced (`user:` / `ip:`) so a user id can never collide with an
 * IP string in the throttler store.
 */
export const throttlerTracker = (req: Record<string, unknown>): string => {
  const userId = req.userId;
  if (typeof userId === "string" && userId.length > 0) {
    return `user:${userId}`;
  }

  const ip =
    (typeof req.ip === "string" && req.ip) ||
    (typeof (req.socket as { remoteAddress?: string } | undefined)
      ?.remoteAddress === "string" &&
      (req.socket as { remoteAddress?: string }).remoteAddress) ||
    "unknown";

  return `ip:${ip}`;
};
