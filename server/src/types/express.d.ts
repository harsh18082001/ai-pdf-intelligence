import 'express';
import type { RequestOwner } from './index.js';

declare global {
  namespace Express {
    interface Request {
      file?: Multer.File;
      /** Signed guest session id, set by guest-session.middleware regardless of auth state. */
      guestId?: string;
      /** Resolved identity for this request: an authenticated user or a guest session. */
      owner?: RequestOwner;
      /** Double-submit CSRF token read from the request, set by csrf.middleware. */
      csrfToken?: string;
    }
  }
}
