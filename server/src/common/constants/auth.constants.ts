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

function expiryToMs(expiry: string | number): number {
  if (typeof expiry === "number") {
    return expiry * 1000;
  }

  if (/^\d+$/.test(expiry)) {
    return Number(expiry) * 1000;
  }

  const match = expiry.trim().match(/^(\d+)\s*(ms|s|m|h|d|w)$/i);

  if (!match) {
    throw new Error(`Unsupported JWT expiry format: ${expiry}`);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "ms":
      return value;
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "w":
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported JWT expiry unit: ${unit}`);
  }
}

/** Separate signing key prevents swapping an access JWT for a refresh JWT. */
export const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/** Derived from ACCESS_TOKEN_EXPIRY so cookie and JWT expiry stay aligned. */
export const ACCESS_TOKEN_MAX_AGE_MS = expiryToMs(ACCESS_TOKEN_EXPIRY);
/** Derived from REFRESH_TOKEN_EXPIRY so cookie and JWT expiry stay aligned. */
export const REFRESH_TOKEN_MAX_AGE_MS = expiryToMs(REFRESH_TOKEN_EXPIRY);

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
