import type { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
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
      if (token && token.trim().length > 0) {
        // Method A: Verify as Google ID Token
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: token,
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
          logger.debug({ err: err.message }, 'ID token verification failed, trying Google UserInfo endpoint');
        }

        // Method B: Verify via Google UserInfo endpoint (for Access Tokens or custom tokens)
        try {
          const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userinfoRes.ok) {
            const userInfo = (await userinfoRes.json()) as any;
            if (userInfo && userInfo.sub) {
              req.owner = {
                type: 'user',
                id: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
              };
              return next();
            }
          }
        } catch (err: any) {
          logger.warn({ err: err.message }, 'Google UserInfo verification failed');
        }

        logger.warn('Provided Authorization token is invalid or expired');
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
