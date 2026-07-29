import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { generalLimiter } from './middlewares/rate-limiter.js';

const app = express();

// Trust reverse proxy (Vercel) for accurate client IP in rate limiting
app.set('trust proxy', 1);

const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-id', 'X-Requested-With', 'Accept'],
};

// Express cors() middleware handles all HTTP methods (GET, POST, OPTIONS, etc.) automatically
app.use(cors(corsOptions));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: (env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: false,
  })
);

// Apply rate limiting to all requests
app.use(generalLimiter);

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
