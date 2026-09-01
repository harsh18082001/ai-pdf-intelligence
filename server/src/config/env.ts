import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
// Also try to load from current directory as fallback
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  // Direct (non-pooled) connection — required by `prisma migrate` against Supabase's pgbouncer pooler.
  DIRECT_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  APP_BASE_URL: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),

  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  GEMINI_CHAT_MODEL: z.string().default('gemini-flash-latest'),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-2'),
  PINECONE_API_KEY: z.string().min(1, 'Pinecone API key is required'),
  PINECONE_INDEX_HOST: z.string().url('Pinecone index host is required'),
  LOG_LEVEL: z.string().default('info'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  GUEST_SESSION_SECRET: z.string().min(32, 'GUEST_SESSION_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  // Email (Gmail SMTP via nodemailer)
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default('DocIQ <no-reply@dociq.app>'),

  // Backblaze B2 (S3-compatible)
  B2_KEY_ID: z.string().optional(),
  B2_APPLICATION_KEY: z.string().optional(),
  B2_ENDPOINT: z.string().optional(),
  B2_REGION: z.string().default('eu-central-003'),
  B2_BUCKET_NAME: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

export const env = _env.success ? _env.data : (process.env as any);
