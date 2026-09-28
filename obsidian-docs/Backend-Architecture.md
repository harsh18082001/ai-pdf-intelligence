---
tags: [backend, architecture]
---
## Purpose
Cross-cutting map of the server: request lifecycle, DB/auth approach, background processing, error handling, and the infra files not documented individually.

## Key Details

### Request lifecycle (`app.ts`)
1. `app.set('trust proxy', 1)` — for correct client IP behind Vercel.
2. `cors({ origin: env.CORS_ORIGIN, credentials: true, allowedHeaders: [...,'x-csrf-token',...] })` — locked to one explicit origin now, not `origin: true` (reflect-any-origin) — see [[Known-Issues-and-Conventions]].
3. `helmet()` — security headers.
4. `cookie-parser` — parses `dociq_guest_id`/`dociq_refresh`/`dociq_csrf` cookies onto `req.cookies`.
5. `express.json()`, `express.urlencoded({ extended: true })`
6. `express-fileupload({ limits: { fileSize: MAX_FILE_SIZE_MB * 1MB }, abortOnLimit: true, useTempFiles: false })` — populates `req.files`.
7. `generalLimiter` ([[rate-limiter]]) — global 100 req/15min per IP.
8. [[guest-session.middleware]] — sets `req.owner` to at least a guest.
9. [[auth.middleware]] — upgrades `req.owner` to a user if a valid access token is present.
10. [[csrf.middleware]] — issues the CSRF cookie; rejects non-safe methods without a matching `x-csrf-token` header.
11. `app.use('/api', apiRoutes)` — see [[routes-index|routes/index.ts]]: mounts [[auth.routes]] at `/auth`, [[document.routes]] at `/documents`, [[chat.routes]] at `/documents/:documentId/chat`, [[command.routes]] at `/commands`.
12. `notFoundHandler` then `errorHandler` ([[error-handler]]) — catch-all 404 and the single error→JSON translator.
- Entry point `index.ts`: `app.listen(env.PORT, ...)`, plus `SIGTERM`/`SIGINT` graceful shutdown (`server.close()`).

### Database
PostgreSQL, hosted on Supabase (accessed via a pooled `DATABASE_URL` at runtime and a direct `DIRECT_URL` for `prisma migrate` — see [[ENV-Variables]]), through Prisma (`server/src/db.ts` exports a singleton `PrismaClient`, cached on `globalThis` in dev to survive hot-reload). Seven models now — `User`/`Session`/`VerificationToken` (auth, see [[Auth-System]]) plus the original `Document`/`Chunk`/`Message`/`AIArtifact` — each with a matching repository (`*.repository.ts`) that is the only code allowed to call `prisma.*` directly; services never import `prisma` themselves.

### Auth / tenancy approach
Real authentication now: email/password with Argon2id hashing, JWT access + rotating refresh tokens, plus a server-issued signed guest session for unauthenticated use — see [[Auth-System]] for the full picture. Every request resolves to a `RequestOwner` (`req.owner`) via two chained middlewares ([[guest-session.middleware]] then [[auth.middleware]]), and every document/chat/command controller reads `req.owner` directly instead of parsing headers itself. Tenancy enforcement is now **consistent** across the codebase — the previously-documented gaps (chat history read, command execution) are closed; see [[Known-Issues-and-Conventions]] for that history.

### Background processing pipeline
Despite the `workers/` folder name, there is no queue or separate process. Upload → [[document.service]]`.upload()` → **awaits** `processDocumentAsync()` ([[processor]]) → [[processing.service]]`.processDocument()` runs extract → OCR-check → chunk → embed → persist (Postgres + Pinecone) inline, synchronously, within the same HTTP request/response cycle. This is deliberate for Vercel serverless compatibility (a detached background task would be killed once the response returns). See [[Data-Flow#1. Upload flow]].

### Error handling strategy
One `AppError` class ([[error-handler]]) for all expected/operational errors, thrown from controllers/services; a single Express error-handling middleware translates `AppError` / `ZodError` / `MulterError` / unknown errors into a consistent `{ success, error, details }` JSON shape. Every route handler is wrapped in `asyncHandler` ([[processor|utils/async-handler.ts]]) to funnel thrown/rejected errors into this middleware — except SSE streaming (`chat.controller.streamMessage`), which must catch internally since it writes a non-JSON response format.

### Infra files (not individually documented)
- `server/src/db.ts` — Prisma client singleton (see above).
- `server/src/config/env.ts` — Zod-validated env loading (`dotenv.config()` from both `../.env` and cwd `.env`); process exits in non-production if validation fails. See [[ENV-Variables]] for the full variable list.
- `server/src/config/constants.ts` — `CHUNK_SIZE`/`CHUNK_OVERLAP`/`EMBEDDING_DIMENSION`/`TOP_K_CHUNKS`/`MAX_CONTEXT_TOKENS`/`SUPPORTED_MIME_TYPES`/`DOCUMENT_STATUS` enum/`ARTIFACT_TYPES`/`MESSAGE_ROLES` enum.
- `server/src/types/index.ts` / `types/express.d.ts` — shared DTO interfaces (`ApiResponse<T>`, `DocumentDTO`, `MessageDTO`, `ChunkDTO`, `AIArtifactDTO`, `CommandRequest`, `ChatRequest`, `StreamCallback`) and an Express `Request.file` type augmentation for Multer.
- `server/src/utils/logger.ts` — `pino` logger, pretty-printed in development.
- `server/src/utils/async-handler.ts` — `asyncHandler(fn)` wraps an async Express handler so thrown errors reach `next()`.
- `server/src/ai/ai.types.ts` — `ChatMessage`, `ChatCompletionParams`, `AIProvider` interface, `AIServiceConfig`.
- `server/src/ai/providers/index.ts` — `createAIProvider(config)` factory; currently only `'gemini'` is implemented (other `AIServiceConfig.provider` values throw).

## Source
`server/src/app.ts`, `server/src/index.ts`, `server/src/db.ts`, `server/src/config/*`

## Dependencies
Ties together every backend note in this vault.

## Related
- [[000-Home]]
- [[error-handler]]
- [[rate-limiter]]
- [[processor]]
- [[processing.service]]
- [[Auth-System]]
- [[guest-session.middleware]]
- [[auth.middleware]]
- [[csrf.middleware]]
- [[ENV-Variables]]
- [[API-Contract]]
- [[Data-Flow]]
- [[Known-Issues-and-Conventions]]

## Notes
`MAX_CONTEXT_TOKENS` (6000) is defined in constants but not enforced by any code path — see [[templates]] Notes. `EMBEDDING_DIMENSION` (384) in constants does not match the actual Gemini `text-embedding-004` output dimension (768, per `pinecone.service.ts`'s fallback default and the README's ERD) — this constant appears stale/unused; don't rely on it if you need the real embedding dimension.
