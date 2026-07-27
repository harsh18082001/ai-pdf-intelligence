import 'express';
import type { RequestOwner } from './index.js';

declare global {
  namespace Express {
    interface Request {
      owner?: RequestOwner;
    }
  }
}
