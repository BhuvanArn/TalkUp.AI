/**
 * Augments Express `Request` with fields set at runtime by auth guards.
 * `@types/express` does not include these; without this file, `req.user` / `req.userId`
 * would be type errors unless cast to `any`.
 */
import type { user } from "@entities/user.entity";

declare global {
  namespace Express {
    interface Request {
      /** Set by AccessTokenGuard after verifying the JWT from `cookies.accessToken`. */
      userId?: string;
      /** Full user row from AuthService.verifyAccessToken; use with @CurrentUser(). */
      user?: user;
      /**
       * Set by SessionGuard when the session was authenticated via the refresh cookie
       * (JTI of the refresh token). Omitted when authentication used only the access token.
       */
      refreshJti?: string;
    }
  }
}

/** Makes this file a module so `declare global` merges into the global scope correctly. */
export {};
