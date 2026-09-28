import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { authLimiter } from '../middlewares/rate-limiter.js';
import { requireUser } from '../middlewares/auth.middleware.js';
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from '../middlewares/validation.js';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  csrfToken,
} from '../controllers/auth.controller.js';

const router = Router();

router.get('/csrf-token', asyncHandler(csrfToken));
router.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.post('/logout-all', requireUser, asyncHandler(logoutAll));
router.get('/me', requireUser, asyncHandler(me));
router.get('/verify-email', asyncHandler(verifyEmail));
router.post(
  '/resend-verification',
  authLimiter,
  validate(resendVerificationSchema),
  asyncHandler(resendVerification),
);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), asyncHandler(resetPassword));

export default router;
