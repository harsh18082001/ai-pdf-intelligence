import type { Request, Response, NextFunction } from 'express';

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const sessionIdHeader = req.headers['x-session-id'] as string | undefined;

    if (sessionIdHeader && sessionIdHeader.trim().length > 0) {
      req.owner = {
        type: 'guest',
        id: sessionIdHeader.trim(),
      };
      return next();
    }

    // Default IP / Anonymous Client ID fallback
    const fallbackId = req.ip ? `usr_${req.ip.replace(/[^a-zA-Z0-9]/g, '')}` : 'usr_anonymous';
    req.owner = {
      type: 'guest',
      id: fallbackId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
