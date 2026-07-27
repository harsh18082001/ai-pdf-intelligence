import type { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { AppError } from './error-handler.js';
import { logger } from '../utils/logger.js';
import type { RequestOwner } from '../types/index.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const sessionIdHeader = req.headers['x-session-id'] as string | undefined;

    // 1. Try Google OAuth Bearer Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && env.GOOGLE_CLIENT_ID) {
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();
          if (payload && payload.sub) {
            req.owner = {
              type: 'user',
              id: payload.sub,
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
            };
            return next();
          }
        } catch (err: any) {
          logger.warn({ err: err.message }, 'Failed to verify Google ID token, falling back to guest session if present');
        }
      }
    }

    // 2. Try Guest Session ID Header
    if (sessionIdHeader && sessionIdHeader.trim().length > 0) {
      req.owner = {
        type: 'guest',
        id: sessionIdHeader.trim(),
      };
      return next();
    }

    // 3. Fallback: Default anonymous guest session ID if client didn't send one
    const fallbackGuestId = req.ip ? `guest_${req.ip.replace(/[^a-zA-Z0-9]/g, '')}` : 'guest_anonymous';
    req.owner = {
      type: 'guest',
      id: fallbackGuestId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
