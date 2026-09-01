import type { Request, Response, NextFunction } from 'express';
import { randomToken, hmacSign, timingSafeEqualHex } from '../utils/crypto.js';
import { env } from '../config/env.js';
import { GUEST_COOKIE, setGuestCookie, getCookie } from '../utils/cookies.js';

/**
 * Every request gets a guest identity, server-issued and HMAC-signed so the browser
 * can't forge or swap it (unlike the old client-generated `x-client-id` header).
 * `auth.middleware` runs after this and may override `req.owner` with an authenticated user.
 */
export function guestSessionMiddleware(req: Request, res: Response, next: NextFunction) {
  const raw = getCookie(req, GUEST_COOKIE);

  if (raw && isValidSignedGuestId(raw)) {
    const id = raw.split('.')[0] as string;
    req.guestId = id;
    req.owner = { type: 'guest', id };
    return next();
  }

  const id = randomToken(16);
  const signed = `${id}.${hmacSign(id, env.GUEST_SESSION_SECRET)}`;
  setGuestCookie(res, signed);
  req.guestId = id;
  req.owner = { type: 'guest', id };
  next();
}

function isValidSignedGuestId(value: string): boolean {
  const [id, sig] = value.split('.');
  if (!id || !sig) return false;
  const expected = hmacSign(id, env.GUEST_SESSION_SECRET);
  return timingSafeEqualHex(sig, expected);
}
