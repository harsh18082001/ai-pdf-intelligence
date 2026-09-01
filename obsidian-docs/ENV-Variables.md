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
| `DATABASE_URL` | **yes** | — | Postgres connection string — the **pooled** (pgbouncer, port 6543) Supabase URL, used at runtime by Prisma Client | `server/prisma/schema.prisma` (`datasource db` → `url`), read implicitly via `server/src/db.ts` |
| `DIRECT_URL` | no (but required for migrations) | — | Postgres connection string — the **direct** (non-pooled, port 5432) Supabase URL. `prisma migrate dev`/`reset` need this; pgbouncer's transaction-mode pooling doesn't reliably support the advisory locks Prisma Migrate takes, so pointing migrations at `DATABASE_URL` alone can hang indefinitely | `server/prisma/schema.prisma` (`datasource db` → `directUrl`), Prisma CLI only — never used by the running app |
| `CORS_ORIGIN` | no | `http://localhost:5173` | The frontend's exact origin — `app.ts`'s `cors()` now uses `origin: env.CORS_ORIGIN` (was `origin: true`, a reflect-any-origin anti-pattern, before the auth overhaul; see [[Known-Issues-and-Conventions]]). Must be exact since cookies (`credentials: true`) are in play | `server/src/app.ts` (`corsOptions.origin`) |
| `APP_BASE_URL` | no | `http://localhost:5173` | Public frontend URL, used to build the links inside verification/reset emails | [[email.service]] (`sendVerificationEmail`/`sendPasswordResetEmail`) |
| `COOKIE_DOMAIN` | no | unset | Only set if client+server share a parent domain in prod (e.g. `.dociq.app`) so cookies can be shared across subdomains; leave unset for two independent origins (the current Vercel setup) | `server/src/utils/cookies.ts` (every `res.cookie(...)` call) |
| `JWT_ACCESS_SECRET` | **yes** (min 32 chars) | — | Signs short-lived access tokens | `server/src/utils/jwt.ts` |
| `JWT_REFRESH_SECRET` | **yes** (min 32 chars) | — | Signs refresh tokens (different secret from access, so leaking one doesn't compromise the other) | `server/src/utils/jwt.ts` |
| `GUEST_SESSION_SECRET` | **yes** (min 32 chars) | — | HMAC-signs the guest session id cookie so the browser can't forge/swap it | [[guest-session.middleware]] |
| `ACCESS_TOKEN_TTL_MIN` | no | `15` | Access token lifetime (minutes) | `server/src/utils/jwt.ts` |
| `REFRESH_TOKEN_TTL_DAYS` | no | `30` | Refresh token / `Session` row lifetime (days) | [[auth.service]] |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | no | — | Gmail account + App Password (not the account password — requires 2-Step Verification enabled) for sending verification/reset emails via SMTP; if either is unset, [[email.service]] logs the email instead of sending (dev fallback) | [[email.service]] |
| `EMAIL_FROM` | no | `DocIQ <no-reply@dociq.app>` | From-address for outgoing auth emails | [[email.service]] |
| `B2_KEY_ID` / `B2_APPLICATION_KEY` / `B2_ENDPOINT` | no | — | Backblaze B2 (S3-compatible) credentials for storing original PDFs; if any is missing, [[b2-storage.service]] runs in a disabled no-op mode (`storageKey` stays `null`) | [[b2-storage.service]] |
| `B2_REGION` | no | `eu-central-003` | B2 region for the S3-compatible client | [[b2-storage.service]] |
| `B2_BUCKET_NAME` | no | `dociq-documents` | B2 bucket name | [[b2-storage.service]] |
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
- [[ai.service]], [[gemini.provider]], [[pinecone.service]], [[processor]], [[auth.service]], [[email.service]], [[b2-storage.service]], [[guest-session.middleware]] all indirectly depend on server env vars via `env.ts`.
- [[baseApi]], [[useChat]], [[lib-supabase]] depend on client env vars.

## Related
- [[Backend-Architecture]]
- [[Frontend-Architecture]]
- [[Auth-System]]
- [[Known-Issues-and-Conventions]]

## Notes
If a document upload/chat fails in a fresh environment, check `GEMINI_API_KEY`/`PINECONE_API_KEY`/`PINECONE_INDEX_HOST`/`DATABASE_URL` first — these are the vars with no usable default and no auth-specific fallback. Because production doesn't hard-fail on missing env vars, a misconfigured prod deploy manifests as a runtime error deep in `GeminiProvider`/`PineconeService`, not a clear startup failure. The three auth secrets (`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`GUEST_SESSION_SECRET`) **do** have a hard minimum-length validation (32 chars) with no default — a fresh clone needs these generated (`openssl rand -hex 32`) before `npm run dev:server` will even boot in development (it `process.exit(1)`s on invalid env there). If you see `prisma migrate dev` hang indefinitely against a Supabase database, check that `DIRECT_URL` is set and that `schema.prisma`'s `directUrl` is wired — migrating through the pooled `DATABASE_URL` is the likely cause.
