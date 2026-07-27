import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { migrateGuestData } from '../controllers/auth.controller.js';

const router = Router();

router.post('/migrate-guest', asyncHandler(migrateGuestData));

export default router;
