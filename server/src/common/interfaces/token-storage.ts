/**
 * Pluggable token/session storage for refresh-token rotation and revocation.
 *
 * Architecture:
 * - **Refresh JTI blacklist / consume**: backs strict rotation (replay protection).
 *   Implemented with Postgres rows or Redis SETEX; both must support an atomic
 *   "claim once" via consumeRefreshJti (INSERT PK / SET NX).
 * - **tokenVersion** lives only in Postgres (`user.tokenVersion`). Do not mirror tv
 *   in Redis (no INCR, no dual-write) — avoids split-brain on partial failures.
 * - Logout invalidates sessions by incrementing tv; optional RT blacklist is extra.
 */
export abstract class ITokenStorage {
  /**
   * Marks a JTI as revoked until TTL (time to live, the time after which the token is no longer valid)
   * (logout defense-in-depth, not the primary revoke).
   */
  abstract blacklistToken(jti: string, ttlSeconds: number): Promise<void>;

  /**
   * Atomically claims this refresh JTI for one rotation: first caller wins, others get false.
   * Prevents two concurrent /auth/refresh calls from both minting new pairs from the same RT.
   */
  abstract consumeRefreshJti(jti: string, ttlSeconds: number): Promise<boolean>;

  abstract isJtiBlacklisted(jti: string): Promise<boolean>;

  /** Read current session generation from Postgres (source of truth). */
  abstract getTokenVersion(userId: string): Promise<number>;

  /** Global invalidation: bumps tv in Postgres; all JWTs carrying old tv become invalid. */
  abstract incrementTokenVersion(userId: string): Promise<void>;
}
