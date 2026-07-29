import { Router } from 'express';
import documentRoutes from './document.routes.js';
import chatRoutes from './chat.routes.js';
import commandRoutes from './command.routes.js';

const router = Router();

router.use('/documents', documentRoutes);
router.use('/documents/:documentId/chat', chatRoutes);
router.use('/commands', commandRoutes);

export default router;
