import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { validate, chatMessageSchema } from '../middlewares/validation.js';
import { aiLimiter } from '../middlewares/rate-limiter.js';
import {
  sendMessage,
  streamMessage,
  getChatHistory,
} from '../controllers/chat.controller.js';

const router = Router({ mergeParams: true }); // mergeParams to access documentId from parent router

router.use(aiLimiter);

router.get('/', asyncHandler(getChatHistory));
router.post('/', validate(chatMessageSchema), asyncHandler(sendMessage));
router.get('/stream', asyncHandler(streamMessage));

export default router;
