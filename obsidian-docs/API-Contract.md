---
tags: [api]
---
## Purpose
Exhaustive reference for every HTTP endpoint the backend exposes. An agent implementing a new frontend call should not need to open any other file.

## Key Details

All responses share the envelope `ApiResponse<T>`:
```ts
{ success: boolean; data?: T; error?: string; message?: string; details?: unknown }
```
All error responses (any non-2xx) come from [[error-handler]] and have `success: false`.

Base path: `/api` (mounted in `app.ts`). Global middleware on every route, in order: CORS (`origin: env.CORS_ORIGIN, credentials: true`, allows header `x-csrf-token`), `helmet()`, `cookie-parser`, `generalLimiter` (100 req/15min/IP), [[guest-session.middleware]] (issues/reads the guest cookie → `req.owner`), [[auth.middleware]] (upgrades `req.owner` to a user if a valid `Authorization: Bearer` access token is present), [[csrf.middleware]] (issues the CSRF cookie; rejects any non-GET/HEAD/OPTIONS request whose `x-csrf-token` header doesn't match it).

"Auth" column: every request has an owner now — either a logged-in user or a signed, server-issued guest session (see [[Auth-System]]). Every document/chat/command endpoint below is ownership-checked against `req.owner`; there is no "endpoint skips the check if identity is absent" case anymore (there's always an identity). See [[Known-Issues-and-Conventions]] for the history of what used to be unscoped.

---

### Auth — [[auth.routes]] → [[auth.controller]] → [[auth.service]]

All under `/api/auth`. See [[Auth-System]] for the full architecture; this is just the endpoint list.

- `GET /api/auth/csrf-token` — no auth. Issues/returns the CSRF cookie + token (also implicitly issued by [[csrf.middleware]] on any GET). `{ csrfToken: string }`.
- `POST /api/auth/register` — `authLimiter`. Body: `{ email, password, name? }` (`registerSchema`). Creates the user, migrates any guest documents (from the request's guest cookie) onto it, sends a verification email, sets the refresh cookie. `201`: `{ user: UserDTO, accessToken: string }`. `409` if the email is taken.
- `POST /api/auth/login` — `authLimiter`. Body: `{ email, password }`. Verifies password (Argon2id), migrates guest documents, sets the refresh cookie. `200`: `{ user: UserDTO, accessToken }`. `401` invalid credentials, `423` if locked out (5 failed attempts → 15 min lock).
- `POST /api/auth/refresh` — no body; reads the refresh cookie. Rotates it (old one is invalidated; **reuse is treated as compromise and revokes every session for that user**). `200`: `{ user, accessToken }`. `401` if no/invalid/expired/reused session.
- `POST /api/auth/logout` — revokes the current session, clears the refresh cookie. `200`.
- `POST /api/auth/logout-all` — requires a logged-in user (`requireUser`); revokes every session for that user. `200`.
- `GET /api/auth/me` — requires a logged-in user. `200`: `UserDTO`.
- `GET /api/auth/verify-email?token=...` — marks the token's user as email-verified.
- `POST /api/auth/resend-verification` — `authLimiter`. Body: `{ email }`. Always `200` with a generic message, whether or not the email exists (avoids leaking account existence).
- `POST /api/auth/forgot-password` — `authLimiter`. Body: `{ email }`. Same generic-response pattern as above.
- `POST /api/auth/reset-password` — `authLimiter`. Body: `{ token, password }`. Revokes all existing sessions for that user on success (a password change logs out every device).

`UserDTO`:
```ts
{ id: string; email: string; name: string | null; role: string; emailVerified: boolean }
```

---

### Documents — [[document.routes]] → [[document.controller]] → [[document.service]]

#### `POST /api/documents`
- Middleware: [[upload|uploadPdf]] (validates file present, single, `application/pdf`) → [[rate-limiter|generalLimiter]] only (not `aiLimiter`).
- Request: `multipart/form-data`, field `file` (PDF, ≤ `MAX_FILE_SIZE_MB`, default 50MB).
- Behavior: uploads the original PDF to Backblaze B2 (if configured — see [[b2-storage.service]]), creates a `Document` row (`status: pending`, owned by `req.owner`), then **synchronously runs the full processing pipeline** (extract → chunk → embed → Pinecone upsert) before responding — see [[Data-Flow#1. Upload flow]]. Can take several seconds.
- Response `201`: `{ success: true, data: DocumentDTO }` — `DocumentDTO`'s `status` reflects the *final* pipeline outcome (`completed` / `failed` / `ocr_required`), not `pending`.
- Errors: `400` no file / multiple files / non-PDF / file too large (`MulterError`).

#### `GET /api/documents`
- Response `200`: `{ success: true, data: DocumentDTO[] }`, scoped to `req.owner`, ordered `createdAt desc`. Headers: `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`.

#### `GET /api/documents/recent`
- Response `200`: `{ success: true, data: DocumentDTO[] }`, scoped to `req.owner`, ordered `lastAccessedAt desc`, capped at 5. Backs [[useRecentDocuments]] — must be registered before `GET /:id` in [[document.routes]] to avoid Express matching `recent` as the `:id` param.

#### `GET /api/documents/:id`
- Params: `id` (numeric string; non-numeric → `400 Invalid document ID`).
- Behavior: ownership-checked against `req.owner` (`404` if not found or not owned), then bumps `lastAccessedAt` to now.
- Response `200`: `{ success: true, data: DocumentDTO }`. Same no-store cache headers as above.

#### `GET /api/documents/:id/file`
- Ownership-checked like `GET /:id`. `404` if the document has no `storageKey` (B2 wasn't configured at upload time), `503` if B2 isn't configured at all.
- Response `200`: `{ success: true, data: { url: string } }` — a short-lived (5 min) presigned B2 URL. Not currently called from the frontend — [[PDFViewer]] still reads from IndexedDB, see [[Known-Issues-and-Conventions]].

#### `DELETE /api/documents/:id`
- Ownership-checked like `GET /:id`.
- Behavior: deletes Pinecone vectors, the B2 object (if any), then the Postgres row (cascades to `Chunk`/`Message`/`AIArtifact`).
- Response: `204`, empty body.
- Errors: `404` (not found / not owned), `400` invalid id.

`DocumentDTO`:
```ts
{ id: number; title: string; fileName: string; fileSize: number; pageCount: number;
  status: 'pending'|'processing'|'completed'|'failed'|'ocr_required'; errorMsg?: string;
  lastAccessedAt: string; createdAt: string; updatedAt: string }
```

---

### Chat — [[chat.routes]] → [[chat.controller]] → [[chat.service]]

All three routes are mounted at `/api/documents/:documentId/chat` and additionally pass through `aiLimiter` (20 req/min/IP, stacked on top of `generalLimiter`).

#### `GET /api/documents/:documentId/chat`
- Ownership-checked against `req.owner` (`404` if not found/not owned) — previously the one unscoped read in the app, now closed. See [[Known-Issues-and-Conventions]].
- Response `200`: `{ success: true, data: MessageDTO[] }`, ordered `createdAt asc`.
- Errors: `400` invalid `documentId`, `404` document not found/not owned.

#### `POST /api/documents/:documentId/chat`
- Ownership-checked (`404` on mismatch).
- Request body (Zod `chatMessageSchema`): `{ message: string (1–5000 chars) }`.
- Behavior: non-streaming; blocks until the full Gemini response returns; saves both user and assistant messages.
- Response `200`: `{ success: true, data: { message: string } }`.
- Errors: `400` invalid documentId / validation error / document not `completed` / no context chunks found; `404` not found/mismatch.
- Note: defined and functional, but **the frontend does not call this** — [[chatApi]] only implements `getChatHistory`; real sending goes through the `/stream` route below.

#### `GET /api/documents/:documentId/chat/stream`
- Ownership-checked via `req.owner`, same as above (mismatch → `404`, delivered as an SSE error event since headers are already committed to `text/event-stream`). Identity here still comes from the guest/refresh cookies (sent automatically by the browser on the `EventSource` request) plus whatever `Authorization` header [[useChat]] can attach — **not** a `clientId` query param anymore.
- Request: query param `message` (required string).
- Response: `Content-Type: text/event-stream`. Emits `data: "<chunk text, JSON-stringified>"` per token, then `data: [DONE]` and closes. On failure emits `data: {"error": "..."}` then closes. **Not wrapped in `ApiResponse`.**
- This is the endpoint the actual chat UI uses ([[useChat]]).

`MessageDTO`:
```ts
{ id: number; documentId: number; role: 'user'|'assistant'|'system'; content: string; createdAt: string }
```

---

### Commands — [[command.routes]] → [[command.controller]] → [[command.service]]

#### `POST /api/commands`
- Ownership-checked against `req.owner` now (previously the least-scoped endpoint in the app — see [[Known-Issues-and-Conventions]]).
- Middleware: `aiLimiter` → `validate(commandSchema)`.
- Request body (Zod `commandSchema`):
  ```ts
  { documentId: number (positive int); command: string (must be in ARTIFACT_TYPES); regenerate?: boolean }
  ```
  `ARTIFACT_TYPES = ['summary','key_points','insights','flashcards','quiz','interview_questions','resume_analysis']` — only the first three have real prompt implementations; the rest silently generate a summary (see [[command.service]] Notes).
- Behavior: if `!regenerate` and a cached `AIArtifact` of that `(documentId, type)` exists, returns it instantly with no LLM call; else builds a prompt from **all** chunks (no top-K truncation), calls Gemini, and upserts the result.
- Response `200`: `{ success: true, data: AIArtifactDTO }`.
- Errors: `400` invalid command / validation error / document not `completed` / no chunks found.

`AIArtifactDTO`:
```ts
{ id: number; documentId: number; type: string; content: string; createdAt: string; updatedAt: string }
```

## Source
`server/src/routes/*.ts`, `server/src/controllers/*.ts`, `server/src/middlewares/validation.ts`

## Dependencies
See per-endpoint links above.

## Related
- [[document.routes]] / [[chat.routes]] / [[command.routes]]
- [[document.controller]] / [[chat.controller]] / [[command.controller]]
- [[document.service]] / [[chat.service]] / [[command.service]]
- [[documentApi]] / [[chatApi]] / [[commandApi]]
- [[Data-Flow]]
- [[Known-Issues-and-Conventions]]

## Notes
The project's own `README.md` describes a slightly different API shape (`/api/documents/upload`, `/api/chat/:documentId`, `/api/chat/:documentId/stream`, `/api/commands/:documentId`) — **that does not match the actual implemented routes** documented above. Treat this note (and the linked route/controller files) as ground truth over the README, which appears to be aspirational/marketing copy rather than kept in sync with the code.
