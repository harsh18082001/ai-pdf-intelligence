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

Base path: `/api` (mounted in `app.ts`). Global middleware on every route: CORS (`origin: true, credentials: true`, allows header `x-client-id`), `helmet()`, `generalLimiter` (100 req/15min/IP).

"Auth" column: this app has no real authentication. "clientId" means the endpoint reads an optional identity string via `x-client-id` header → `clientId` query → `clientId` body (in that priority order) and — only where noted — filters/checks ownership against it. See [[Known-Issues-and-Conventions]] for exactly which endpoints do and don't enforce it.

---

### Documents — [[document.routes]] → [[document.controller]] → [[document.service]]

#### `POST /api/documents`
- Auth: clientId optional, attached to the created row if present.
- Middleware: [[upload|uploadPdf]] (validates file present, single, `application/pdf`) → [[rate-limiter|generalLimiter]] only (not `aiLimiter`).
- Request: `multipart/form-data`, field `file` (PDF, ≤ `MAX_FILE_SIZE_MB`, default 50MB).
- Behavior: creates a `Document` row (`status: pending`), then **synchronously runs the full processing pipeline** (extract → chunk → embed → Pinecone upsert) before responding — see [[Data-Flow#1. Upload flow]]. Can take several seconds.
- Response `201`: `{ success: true, data: DocumentDTO }` — `DocumentDTO`'s `status` reflects the *final* pipeline outcome (`completed` / `failed` / `ocr_required`), not `pending`.
- Errors: `400` no file / multiple files / non-PDF / file too large (`MulterError`).

#### `GET /api/documents`
- Auth: clientId — **required to get non-empty results**; if absent, returns `[]` (not an error).
- Response `200`: `{ success: true, data: DocumentDTO[] }`, ordered `createdAt desc`. Headers: `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`.

#### `GET /api/documents/:id`
- Auth: clientId — if provided, must match the document's `clientId` or `404`; if omitted, no ownership check (any document readable by ID).
- Params: `id` (numeric string; non-numeric → `400 Invalid document ID`).
- Response `200`: `{ success: true, data: DocumentDTO }`. Same no-store cache headers as above.
- Errors: `404` if not found or `clientId` mismatch.

#### `DELETE /api/documents/:id`
- Auth: same ownership rule as GET `:id`.
- Behavior: deletes Pinecone vectors for the document, then the Postgres row (cascades to `Chunk`/`Message`/`AIArtifact`).
- Response: `204`, empty body.
- Errors: `404` (not found / mismatch), `400` invalid id.

`DocumentDTO`:
```ts
{ id: number; title: string; fileName: string; fileSize: number; pageCount: number;
  status: 'pending'|'processing'|'completed'|'failed'|'ocr_required'; errorMsg?: string;
  createdAt: string; updatedAt: string }
```

---

### Chat — [[chat.routes]] → [[chat.controller]] → [[chat.service]]

All three routes are mounted at `/api/documents/:documentId/chat` and additionally pass through `aiLimiter` (20 req/min/IP, stacked on top of `generalLimiter`).

#### `GET /api/documents/:documentId/chat`
- Auth: **none enforced** — no clientId check at all, only that the document exists. See [[Known-Issues-and-Conventions]].
- Response `200`: `{ success: true, data: MessageDTO[] }`, ordered `createdAt asc`.
- Errors: `400` invalid `documentId`, `404` document not found.

#### `POST /api/documents/:documentId/chat`
- Auth: clientId — enforced (mismatch → `404`).
- Request body (Zod `chatMessageSchema`): `{ message: string (1–5000 chars) }`.
- Behavior: non-streaming; blocks until the full Gemini response returns; saves both user and assistant messages.
- Response `200`: `{ success: true, data: { message: string } }`.
- Errors: `400` invalid documentId / validation error / document not `completed` / no context chunks found; `404` not found/mismatch.
- Note: defined and functional, but **the frontend does not call this** — [[chatApi]] only implements `getChatHistory`; real sending goes through the `/stream` route below.

#### `GET /api/documents/:documentId/chat/stream`
- Auth: clientId — enforced (mismatch → `404`, delivered as an SSE error event since headers are already committed to `text/event-stream`).
- Request: query params `message` (required string) and optionally `clientId` (used here since this is a raw `EventSource` call, not going through `baseApi`'s header injection — see [[useChat]]).
- Response: `Content-Type: text/event-stream`. Emits `data: "<chunk text, JSON-stringified>"` per token, then `data: [DONE]` and closes. On failure emits `data: {"error": "..."}` then closes. **Not wrapped in `ApiResponse`.**
- This is the endpoint the actual chat UI uses ([[useChat]]).

`MessageDTO`:
```ts
{ id: number; documentId: number; role: 'user'|'assistant'|'system'; content: string; createdAt: string }
```

---

### Commands — [[command.routes]] → [[command.controller]] → [[command.service]]

#### `POST /api/commands`
- Auth: **none at all** — `clientId` is never read on this route/controller/service. Any caller who knows a valid, `completed` `documentId` can trigger/read its artifacts. See [[Known-Issues-and-Conventions]].
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
