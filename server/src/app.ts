import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { generalLimiter } from './middlewares/rate-limiter.js';

const app = express();

// Trust Vercel's reverse proxy for accurate client IP in rate limiting
app.set('trust proxy', 1);

// CORS — must be the VERY FIRST middleware before anything else
const corsOptions: cors.CorsOptions = {
  origin: true, // Reflect the request origin — simplest, most reliable for Vercel
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight for ALL routes (Express 5 syntax)
app.options('/{0,}', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all requests
app.use(generalLimiter);

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
