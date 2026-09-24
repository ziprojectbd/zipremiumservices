import type { Request, Response, NextFunction } from 'express';
import env from '@config/env';

/**
 * CSRF guard for the cookie-authenticated auth endpoints (refresh / logout).
 *
 * The refresh token is a cookie, so the browser attaches it automatically. The
 * cookie is `SameSite=Lax`, which already blocks cross-site POSTs; this is the
 * defence-in-depth layer for browsers/proxies that do not honour it.
 *
 * When the token arrives in the request BODY there is no ambient credential and
 * therefore no CSRF surface, so those requests are allowed through.
 */

function allowedOrigins(): string[] {
  const extra = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  return [env.CLIENT_URL, ...extra].filter(Boolean).map((o) => o.replace(/\/$/, ''));
}

function originOf(value: string | undefined): string {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

export function cookieOriginGuard(req: Request, res: Response, next: NextFunction): void {
  // Only cookie-borne credentials need this check.
  const cookieName = env.REFRESH_COOKIE_NAME;
  const hasCookie = Boolean(req.cookies?.[cookieName]);
  if (!hasCookie) {
    next();
    return;
  }

  const origin = originOf(req.headers.origin as string | undefined) || originOf(req.headers.referer as string | undefined);

  // No Origin/Referer at all: only same-origin XHR omits Origin, and a
  // cross-site form POST always sends one, so treat it as trusted (SameSite=Lax
  // still applies). Allowing it keeps non-browser clients working.
  if (!origin) {
    next();
    return;
  }

  const allowed = allowedOrigins();
  if (allowed.includes(origin)) {
    next();
    return;
  }

  // In development also accept the local Vite dev server.
  if (env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    next();
    return;
  }

  res.status(403).json({ success: false as const, error: 'Request blocked by CSRF protection' });
}
