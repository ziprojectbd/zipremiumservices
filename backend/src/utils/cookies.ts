import type { Request, Response, CookieOptions } from 'express';
import env from '@config/env';

/**
 * Refresh-token cookie handling.
 *
 * Security posture:
 *  - `httpOnly` so no JavaScript (and therefore no XSS payload) can read it
 *  - `secure` in production so it is only ever sent over HTTPS
 *  - `sameSite: 'lax'` blocks the cross-site POSTs that CSRF relies on while
 *    still allowing a normal top-level navigation back into the site
 *  - `path` is scoped to the auth endpoints so the token is not attached to
 *    every unrelated API request
 */

export function refreshCookieOptions(maxAgeMs?: number): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: env.REFRESH_COOKIE_SECURE,
    sameSite: env.REFRESH_COOKIE_SAME_SITE,
    path: env.REFRESH_COOKIE_PATH,
  };
  if (env.REFRESH_COOKIE_DOMAIN) options.domain = env.REFRESH_COOKIE_DOMAIN;
  if (maxAgeMs && maxAgeMs > 0) options.maxAge = maxAgeMs;
  return options;
}

/** Convert the configured JWT refresh expiry ("30d", "12h", "900s") to milliseconds. */
export function refreshExpiryToMs(): number {
  const raw = String(env.JWT_REFRESH_EXPIRY || '30d').trim();
  const match = /^(\d+)\s*(ms|s|m|h|d|w)?$/i.exec(raw);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1] ?? '30', 10);
  switch ((match[2] || 'd').toLowerCase()) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000;
    case 'd':
    default:
      return value * 24 * 60 * 60 * 1000;
  }
}

export function setRefreshCookie(res: Response, token: string, maxAgeMs = refreshExpiryToMs()): void {
  res.cookie(env.REFRESH_COOKIE_NAME, token, refreshCookieOptions(maxAgeMs));
}

export function clearRefreshCookie(res: Response): void {
  // Same attributes as set (path/domain/sameSite/secure) or the browser keeps
  // the original cookie in place.
  const { maxAge: _maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(env.REFRESH_COOKIE_NAME, options);
}

/** Read the refresh token from the cookie, falling back to the legacy request body. */
export function readRefreshToken(req: Request): string {
  const fromCookie = req.cookies?.[env.REFRESH_COOKIE_NAME];
  if (typeof fromCookie === 'string' && fromCookie) return fromCookie;
  const fromBody = req.body?.refreshToken;
  if (typeof fromBody === 'string' && fromBody) return fromBody;
  return '';
}

/** True when the refresh token came from the cookie (i.e. browser-managed, CSRF-relevant). */
export function usedRefreshCookie(req: Request): boolean {
  const value = req.cookies?.[env.REFRESH_COOKIE_NAME];
  return typeof value === 'string' && value.length > 0;
}
