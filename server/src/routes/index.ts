import { Router } from 'express';
import documentRoutes from './document.routes.js';
import chatRoutes from './chat.routes.js';
import commandRoutes from './command.routes.js';
import authRoutes from './auth.routes.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Apply auth middleware to resolve user/guest identity on all API routes
router.use(authMiddleware);

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/documents/:documentId/chat', chatRoutes);
router.use('/commands', commandRoutes);

export default router;
