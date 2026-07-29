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
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  GEMINI_CHAT_MODEL: z.string().default('gemini-flash-latest'),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-2'),
  PINECONE_API_KEY: z.string().min(1, 'Pinecone API key is required'),
  PINECONE_INDEX_HOST: z.string().min(1, 'Pinecone index host is required'),
  LOG_LEVEL: z.string().default('info'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  // Backblaze B2 Storage (optional)
  B2_KEY_ID: z.string().optional(),
  B2_APPLICATION_KEY: z.string().optional(),
  B2_BUCKET_NAME: z.string().optional(),
  B2_ENDPOINT: z.string().optional(),
  B2_REGION: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  // On Vercel, process.exit kills the function before CORS headers can be sent.
  // Only exit in non-production; in production, throw so the error handler catches it.
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

export const env = _env.success ? _env.data : (process.env as any);
