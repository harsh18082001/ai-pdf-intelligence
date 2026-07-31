---
tags: [backend, controller]
---
## Purpose
HTTP/SSE handlers for chat: history read, non-streaming send, streaming send.

## Key Details
- `getClientId(req)` — same helper as [[document.controller]] (duplicated, not shared).
- `sendMessage(req, res: Response<ApiResponse<{ message: string }>>)`: parses `documentId` from `req.params.documentId`, reads `message` from `req.body`, calls `chatService.sendMessage(documentId, message, clientId)`, responds `200` with `{ message: response }`.
- `streamMessage(req, res)` — **not wrapped in the `ApiResponse` envelope**, writes raw SSE:
  1. Validates `documentId` (plain JSON 400 response if invalid, not `AppError`/`asyncHandler` — because headers may already need custom handling).
  2. Reads `message` from `req.query.message` (400 if missing).
  3. `res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })`, `res.flushHeaders()`.
  4. Calls `chatService.streamMessage(documentId, message, onChunk, clientId)` where `onChunk = (chunk) => res.write(`data: ${JSON.stringify(chunk)}\n\n`)`.
  5. On completion: `res.write('data: [DONE]\n\n'); res.end()`. On error: logs, writes `data: {"error": ...}`, ends.
- `getChatHistory(req, res: Response<ApiResponse<MessageDTO[]>>)`: parses `documentId`, calls `chatService.getHistory(documentId)` (note: **no `clientId` passed** — see Notes), responds with the message array.

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

## Notes
`getChatHistory` does not extract or forward `clientId` at all, and [[chat.service]]`.getHistory()` only checks the document exists — **it does not check `doc.clientId` matches the caller**, unlike `sendMessage`/`streamMessage` (via `prepareChat`) which do. In other words, chat history for any document ID is readable by anyone who knows/guesses the numeric ID, even though sending new messages to it is gated. If you touch this controller, don't assume history-read is already ownership-scoped — see [[Known-Issues-and-Conventions]].
