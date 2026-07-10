import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { validate, commandSchema } from '../middlewares/validation.js';
import { aiLimiter } from '../middlewares/rate-limiter.js';
import { executeCommand } from '../controllers/command.controller.js';

const router = Router();

router.use(aiLimiter);

router.post('/', validate(commandSchema), asyncHandler(executeCommand));

export default router;
