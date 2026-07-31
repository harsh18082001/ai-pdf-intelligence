---
tags: [config]
---
## Purpose
Every environment variable the app reads, which side consumes it, and exactly where.

## Key Details

### Server (`server/.env`, documented in `server/.env.example`; loaded/validated by `server/src/config/env.ts`)

| Variable | Required | Default | Purpose | Consumed at |
|---|---|---|---|---|
| `PORT` | no | `3001` | HTTP port the Express server listens on | `server/src/index.ts:5` (`app.listen(env.PORT, ...)`) |
| `NODE_ENV` | no | `development` | Toggles pretty logging, dotenv fallback path behavior, whether env-validation failure exits the process | `server/src/utils/logger.ts` (pino transport), `server/src/config/env.ts` (exit-on-invalid gate) |
| `DATABASE_URL` | **yes** | — | Postgres connection string (Supabase-hosted) | `server/prisma/schema.prisma` (`datasource db`), read implicitly by Prisma Client via `server/src/db.ts` |
| `CORS_ORIGIN` | no | `http://localhost:5173` | Declared in the env schema but **not actually read by `app.ts`** — CORS is configured with `origin: true` (reflects any origin), not `env.CORS_ORIGIN` | `server/src/config/env.ts` only (validated, unused downstream) |
| `GEMINI_API_KEY` | **yes** | — | Auth for the Gemini API | `server/src/ai/ai.service.ts` (passed into `createAIProvider`) → [[gemini.provider]] |
| `GEMINI_CHAT_MODEL` | no | `gemini-flash-latest` | Model name for chat/completion calls | [[ai.service]] constructor, log lines |
| `GEMINI_EMBEDDING_MODEL` | no | `gemini-embedding-2` | Model name for embedding calls | [[ai.service]] constructor, log lines |
| `PINECONE_API_KEY` | **yes** | — | Auth for the Pinecone client | [[pinecone.service]] constructor |
| `PINECONE_INDEX_HOST` | **yes** | — | Validated as a required URL, but the Pinecone client is constructed with just `apiKey` and index name `'dociq'` — the host isn't referenced by name in [[pinecone.service]] (the Pinecone SDK may use it internally / it may be vestigial) | `server/src/config/env.ts` (schema only) |
| `LOG_LEVEL` | no | `info` | pino log level | [[processor|utils/logger.ts]] |
| `MAX_FILE_SIZE_MB` | no | `50` | Max upload size (MB) | `server/src/app.ts` (`express-fileupload` `limits.fileSize`) |

`env.ts` loads `.env` from **two** locations: `path.resolve(process.cwd(), '../.env')` (parent dir — i.e. monorepo root when running from `server/`) and a plain `dotenv.config()` (cwd) as fallback. In `development`, a failed Zod validation calls `process.exit(1)`; in `production` it logs the error but continues with raw `process.env` (typed `any`) — meaning a missing required var in production does not crash the process, it just produces `undefined` values that will fail later, deeper in the call stack (e.g. inside `GeminiProvider`'s constructor throwing `'Gemini API key is required'`).

### Client (Vite `import.meta.env.*`, prefix `VITE_`)

**No `client/.env.example` file exists in this repo** — these are documented here from source usage only:

| Variable | Required | Default | Purpose | Consumed at |
|---|---|---|---|---|
| `VITE_API_URL` | no | `/api` | Base URL for all API calls | [[baseApi]] (`fetchBaseQuery({ baseUrl })`), [[useChat]] (manually building the `EventSource` URL) |
| `VITE_SUPABASE_URL` | no | `''` | Supabase project URL | [[lib-supabase|lib/supabase.ts]] — **file is unused**, so this var currently has no real effect |
| `VITE_SUPABASE_ANON_KEY` | no | `''` | Supabase anon/public key | [[lib-supabase|lib/supabase.ts]] — **file is unused**, same caveat |

The root `README.md` documents a different client var name, `VITE_API_BASE_URL` — this does **not** match the actual code, which reads `VITE_API_URL`. Trust the source (`baseApi.ts`, `useChat.ts`), not the README, when setting up a local `client/.env`.

## Source
`server/.env.example`, `server/src/config/env.ts`, `client/src/api/baseApi.ts`, `client/src/hooks/useChat.ts`, `client/src/lib/supabase.ts`

## Dependencies
- [[ai.service]], [[gemini.provider]], [[pinecone.service]], [[processor]] all indirectly depend on server env vars via `env.ts`.
- [[baseApi]], [[useChat]], [[lib-supabase]] depend on client env vars.

## Related
- [[Backend-Architecture]]
- [[Frontend-Architecture]]
- [[Known-Issues-and-Conventions]]

## Notes
If a document upload/chat fails in a fresh environment, check `GEMINI_API_KEY`/`PINECONE_API_KEY`/`PINECONE_INDEX_HOST`/`DATABASE_URL` first — these are the four vars with no usable default. Because production doesn't hard-fail on missing env vars, a misconfigured prod deploy manifests as a runtime error deep in `GeminiProvider`/`PineconeService`, not a clear startup failure.
