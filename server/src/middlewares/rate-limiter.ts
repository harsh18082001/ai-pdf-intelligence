import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 20, // Limit each IP to 20 requests per window for AI endpoints
  message: {
    success: false,
    error: 'Too many AI requests from this IP, please try again later.',
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

/** Strict limiter for register/login/forgot-password — slows down credential-stuffing/brute-force. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 attempts per IP per window
  message: {
    success: false,
    error: 'Too many auth requests from this IP, please try again later.',
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
