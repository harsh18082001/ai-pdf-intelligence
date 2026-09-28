---
tags: [backend, controller]
---
## Purpose
HTTP/SSE handlers for chat: history read, non-streaming send, streaming send.

## Key Details
- No local `getClientId()` helper anymore — reads `req.owner` directly (same as [[document.controller]]).
- `sendMessage(req, res: Response<ApiResponse<{ message: string }>>)`: parses `documentId`, reads `message` from `req.body`, calls `chatService.sendMessage(documentId, message, req.owner)`, responds `200` with `{ message: response }`.
- `streamMessage(req, res)` — **not wrapped in the `ApiResponse` envelope**, writes raw SSE. Same structure as before, now passes `req.owner` (captured into a local `owner` const before the SSE headers are written, since `req.owner` could theoretically be read again after `res.writeHead` but there's no reason to re-touch `req` mid-stream).
- `getChatHistory(req, res: Response<ApiResponse<MessageDTO[]>>)`: parses `documentId`, calls `chatService.getHistory(documentId, req.owner)` — **now ownership-checked** (previously called with no owner argument at all).

## Source
`server/src/controllers/chat.controller.ts`

## Dependencies
- Imports: [[chat.service]], `AppError` from [[error-handler]], `ApiResponse`/`MessageDTO` types, [[logger]].
- Called by: [[chat.routes]].

## Related
- [[chat.routes]]
- [[chat.service]]
- [[useChat]]
- [[Data-Flow#2. Chat message flow]]
- [[Known-Issues-and-Conventions#Chat history and commands are now tenant-scoped too (previously a known gap — closed)]]

## Notes
`getChatHistory` used to be the one read path in the backend with zero tenant scoping — that's closed now (see [[chat.service]]). If you're reading an older mental model of this file, the "any caller who knows a documentId can read its chat history" gap no longer exists.
