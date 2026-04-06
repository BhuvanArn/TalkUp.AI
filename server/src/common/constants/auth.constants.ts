import { CookieOptions } from "express";

/**
 * Auth cookie and JWT tuning shared by AuthController and guards.
 *
 * __Host- prefix (production only): browsers require Secure + Path=/ + no Domain.
 * That matches API-only cookies on e.g. api.example.com. Dev uses plain names so
 * http:// localhost still works (__Host- requires HTTPS).
 *
 * SameSite defaults to lax: good for schemeful same-site SPA↔API (talkupai.online
 * → api.talkupai.online). For true cross-site cookie auth, set COOKIE_SAMESITE=none
 * (and Secure) via env — see main.ts CORS discussion in ops docs.
 */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-access_token"
  : "access_token";

export const REFRESH_COOKIE_NAME = IS_PRODUCTION
  ? "__Host-refresh_token"
  : "refresh_token";

export const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

export const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/** Separate signing key prevents swapping an access JWT for a refresh JWT. */
export const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/** Must stay aligned with ACCESS_TOKEN_EXPIRY / JWT sign options. */
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
/** Must stay aligned with REFRESH_TOKEN_EXPIRY / JWT sign options. */
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const COOKIE_SAMESITE_ENV = process.env.COOKIE_SAMESITE as
  | "lax"
  | "strict"
  | "none"
  | undefined;

export const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: COOKIE_SAMESITE_ENV ?? "lax",
  path: "/",
};
