import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Runs after guest-session.middleware. If a valid access token is present, it replaces
 * the guest owner with the authenticated user — otherwise the guest identity stands.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    const payload = verifyAccessToken(token);
    if (payload) {
      req.owner = {
        type: 'user',
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
    }
  }
  next();
}

/** Guards routes that require a logged-in user (guests are rejected). */
export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (req.owner?.type !== 'user') {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  next();
}
