import type { Request, Response, NextFunction } from 'express';
import { randomToken, timingSafeEqualHex } from '../utils/crypto.js';
import { setCsrfCookie, CSRF_COOKIE, getCookie } from '../utils/cookies.js';
import { AppError } from './error-handler.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER = 'x-csrf-token';

/**
 * Double-submit cookie CSRF check. The cookie is issued for every request (readable by JS,
 * unlike the guest/refresh cookies) and must be echoed back in a header on state-changing
 * requests — a cross-site page can trigger the cookie-bearing request but can't read the
 * cookie to put it in a header, so it can't pass this check.
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  let token = getCookie(req, CSRF_COOKIE);
  if (!token) {
    token = randomToken(16);
    setCsrfCookie(res, token);
  }
  req.csrfToken = token;

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const header = req.headers[CSRF_HEADER] as string | undefined;
  if (!header || !timingSafeEqualHex(header, token)) {
    return next(new AppError('Invalid or missing CSRF token', 403));
  }
  next();
}
