import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fileUpload from 'express-fileupload';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { generalLimiter } from './middlewares/rate-limiter.js';

const app = express();
app.set('trust proxy', 1);

const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-id']
};
app.use(cors(corsOptions));
app.options('/{0,}', cors(corsOptions));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ limits: { fileSize: (env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024 }, abortOnLimit: true, useTempFiles: false }));

app.use(generalLimiter);
app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
