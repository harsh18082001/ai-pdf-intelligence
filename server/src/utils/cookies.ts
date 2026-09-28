import type { Request, Response } from 'express';
import { env } from '../config/env.js';

export const GUEST_COOKIE = 'dociq_guest_id';
export const REFRESH_COOKIE = 'dociq_refresh';
export const CSRF_COOKIE = 'dociq_csrf';

/**
 * Client and server are separate origins (two Vercel projects), so cross-site cookies
 * need SameSite=None + Secure. In local dev over http, browsers reject Secure+None, so
 * fall back to Lax there — that's fine because localhost dev usually runs same-site (proxy)
 * or accepts the slightly looser policy.
 */
function baseCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
  };
}

export function setGuestCookie(res: Response, guestId: string) {
  res.cookie(GUEST_COOKIE, guestId, {
    ...baseCookieOptions(),
    maxAge: 5 * 365 * 24 * 60 * 60 * 1000, // ~5 years
  });
}

export function setRefreshCookie(res: Response, refreshToken: string, maxAgeMs: number) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: maxAgeMs,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions());
}

/** CSRF token cookie is intentionally NOT httpOnly — the client reads it and echoes it back in a header. */
export function setCsrfCookie(res: Response, token: string) {
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

export function getCookie(req: Request, name: string): string | undefined {
  return (req as any).cookies?.[name];
}
