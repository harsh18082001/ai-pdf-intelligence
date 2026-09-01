import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { generalLimiter } from './middlewares/rate-limiter.js';
import { guestSessionMiddleware } from './middlewares/guest-session.middleware.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
import { csrfMiddleware } from './middlewares/csrf.middleware.js';

const app = express();

// Trust reverse proxy (Vercel) for accurate client IP in rate limiting
app.set('trust proxy', 1);

const corsOptions = {
  origin: env.CORS_ORIGIN,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-csrf-token'],
};

// Express cors() middleware handles all HTTP methods (GET, POST, OPTIONS, etc.) automatically
app.use(cors(corsOptions));

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: (env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: false,
  }),
);

// Apply rate limiting to all requests
app.use(generalLimiter);

// Identity: every request gets a guest owner; a valid access token upgrades it to a user.
app.use(guestSessionMiddleware);
app.use(authMiddleware);
app.use(csrfMiddleware);

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
