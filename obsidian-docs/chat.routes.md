---
tags: [backend, api]
---
## Purpose
Express router for chat within a document: history, non-streaming send, SSE streaming send.

## Key Details
Mounted at `/documents/:documentId/chat` under the main router ([[routes-index|routes/index.ts]]) with `Router({ mergeParams: true })` so `req.params.documentId` from the parent path is visible here.

| Method | Path (relative) | Full path | Middleware | Handler |
|---|---|---|---|---|
| GET | `/` | `/api/documents/:documentId/chat` | `aiLimiter` | [[chat.controller#getChatHistory]] |
| POST | `/` | `/api/documents/:documentId/chat` | `aiLimiter` → `validate(chatMessageSchema)` | [[chat.controller#sendMessage]] |
| GET | `/stream` | `/api/documents/:documentId/chat/stream` | `aiLimiter` | [[chat.controller#streamMessage]] |

`router.use(aiLimiter)` applies the stricter AI rate limit ([[rate-limiter]] — 20 req/min/IP) to all three routes. `chatMessageSchema` (from [[validation]]) validates `{ message: string }` (1–5000 chars) on the POST body only — the streaming GET route reads `message` from the query string instead and is **not** Zod-validated (only a manual `if (!message)` check in the controller).

## Source
`server/src/routes/chat.routes.ts`

## Dependencies
- Imports: `asyncHandler`, [[validation]] (`validate`, `chatMessageSchema`), [[rate-limiter]] (`aiLimiter`), handlers from [[chat.controller]].
- Mounted by: [[routes-index|routes/index.ts]] at `/documents/:documentId/chat`.

## Related
- [[chat.controller]]
- [[chat.service]]
- [[chatApi]]
- [[useChat]]
- [[API-Contract]]
- [[Data-Flow#2. Chat message flow]]

## Notes
The GET `/stream` route is what powers real-time chat (consumed by [[useChat]]'s `EventSource`); the POST `/` route exists but the frontend never calls it — [[chatApi]] only defines `getChatHistory`. If you add a non-streaming send feature client-side, this endpoint already exists and works.
