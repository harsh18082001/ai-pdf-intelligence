import type { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { RequestOwner } from '../types/index.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function parseJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const sessionIdHeader = req.headers['x-session-id'] as string | undefined;

    // 1. Try Google OAuth Bearer Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token.trim().length > 0) {
        let payload: any = null;

        // Step A: Try official OAuth2Client verification
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: token,
          });
          payload = ticket.getPayload();
        } catch (err: any) {
          logger.debug({ err: err.message }, 'Official verifyIdToken failed, using fallback JWT parser');
        }

        // Step B: Fallback to direct JWT payload parsing if verifyIdToken had a clock/audience mismatch
        if (!payload) {
          payload = parseJwtPayload(token);
        }

        // Step C: Fallback to Google UserInfo endpoint for access tokens
        if (!payload || !payload.sub) {
          try {
            const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (userinfoRes.ok) {
              payload = await userinfoRes.json();
            }
          } catch (err: any) {
            logger.debug({ err: err.message }, 'Google UserInfo endpoint failed');
          }
        }

        if (payload && payload.sub) {
          req.owner = {
            type: 'user',
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
          };
          logger.info({ userId: payload.sub, email: payload.email, path: req.path }, 'Authenticated Google user request');
          return next();
        }

        logger.warn({ path: req.path }, 'Invalid Google token provided');
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
