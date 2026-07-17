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
  DATABASE_URL: z.string().url().or(z.string().startsWith('file:')),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOCAL_CHAT_MODEL: z.string().default('Xenova/Qwen1.5-0.5B-Chat'),
  LOCAL_EMBEDDING_MODEL: z.string().default('Xenova/all-MiniLM-L6-v2'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  UPLOAD_DIR: z.string().default('./uploads'),
  LOG_LEVEL: z.string().default('info'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
