---
tags: [backend, service]
---
## Purpose
RAG chat orchestration: retrieves relevant chunks from Pinecone, builds a prompt with history, calls Gemini (blocking or streaming), and persists both sides of the conversation.

## Key Details
- `class ChatService`, singleton export `chatService`.
- `private prepareChat(documentId, userMessage, clientId?)` — shared setup for both send paths:
  1. Fetch document, throw 404 if missing or `clientId` mismatch (same pattern as [[document.service]]).
  2. Throw 400 `'Document is not ready for chat. Current status: ' + doc.status` unless `doc.status === DOCUMENT_STATUS.COMPLETED`.
  3. **Saves the user message to Postgres immediately** (`messageRepository.create({ role: USER, content: userMessage })`) — before calling the AI at all.
  4. `aiService.generateEmbedding(userMessage)` → `pineconeService.querySimilar(documentId, queryEmbedding, TOP_K_CHUNKS=5, clientId)`. Throws 400 `'No document content available for context'` if zero matches.
  5. Fetches all messages, `.slice(0, -1)` to drop the just-saved user row, takes the last 6 (`priorMessages.slice(-6)`) as history context.
  6. `buildQAPrompt(userMessage, contextTexts, history)` from [[templates]] → returns `{ messages }`.
- `sendMessage(documentId, userMessage, clientId?): Promise<string>` — `prepareChat` → `aiService.chatCompletion({ messages })` → saves an `ASSISTANT` message → returns the response text.
- `streamMessage(documentId, userMessage, onChunk: StreamCallback, clientId?): Promise<string>` — `prepareChat` → iterates `aiService.chatCompletionStream({ messages })`, calling `onChunk(chunk)` per token and accumulating `fullResponse` → saves the full accumulated response as one `ASSISTANT` message after the stream ends → returns it.
- `getHistory(documentId): Promise<MessageDTO[]>` — **no `clientId` parameter at all**. Only checks the document exists (`if (!doc) throw 404`), not ownership. Returns all messages mapped to `MessageDTO`.

## Source
`server/src/services/chat.service.ts`

## Dependencies
- Imports: [[document.repository]], [[message.repository]], [[ai.service|ai/ai.service.ts]], [[pinecone.service]], `buildQAPrompt` from [[templates]], `AppError`, constants (`TOP_K_CHUNKS`, `DOCUMENT_STATUS`, `MESSAGE_ROLES`).
- Called by: [[chat.controller]] (`sendMessage`, `streamMessage`, `getChatHistory`).

## Related
- [[chat.controller]]
- [[templates]]
- [[ai.service]]
- [[pinecone.service]]
- [[Data-Flow#2. Chat message flow]]
- [[Known-Issues-and-Conventions#Chat history read is not tenant-scoped]]

## Notes
`getHistory` is the one read path in the whole backend with **zero** tenant scoping — it will return the full message history for any valid `documentId`, unlike `sendMessage`/`streamMessage` which both gate on `clientId` via `prepareChat`. If you're asked to fix cross-user data exposure in chat, this is the method to patch (add a `clientId` param and the same `doc.clientId !== clientId` check used elsewhere). If a user's query has no matching Pinecone vectors (empty index, wrong namespace, or a genuinely irrelevant question), the request 400s rather than falling back to a "no context found" AI answer — this is a deliberate error, not a bug, but worth knowing when debugging "chat doesn't work" reports.
