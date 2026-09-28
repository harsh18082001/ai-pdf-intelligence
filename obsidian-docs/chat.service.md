---
tags: [backend, service]
---
## Purpose
RAG chat orchestration: retrieves relevant chunks from Pinecone, builds a prompt with history, calls Gemini (blocking or streaming), and persists both sides of the conversation.

## Key Details
- `class ChatService`, singleton export `chatService`.
- `private prepareChat(documentId, userMessage, owner: RequestOwner)` — shared setup for both send paths:
  1. `documentRepository.findOwnedById(documentId, owner)`, throw 404 if not found/not owned.
  2. Throw 400 unless `doc.status === DOCUMENT_STATUS.COMPLETED`.
  3. Saves the user message to Postgres immediately.
  4. `aiService.generateEmbedding(userMessage)` → `pineconeService.querySimilar(documentId, queryEmbedding, TOP_K_CHUNKS=5, ownerNamespace(owner))` — the Pinecone namespace argument changed from the raw owner id to `ownerNamespace(owner)` (`u_<id>` or `g_<id>`, from `utils/owner.ts`), so it lines up with what [[processing.service]] wrote at upload time.
  5. Builds chat history from the last 6 prior messages, then `buildQAPrompt(...)` from [[templates]].
- `sendMessage(documentId, userMessage, owner): Promise<string>` and `streamMessage(documentId, userMessage, onChunk, owner): Promise<string>` — unchanged shape, just take `owner` instead of `clientId?`.
- `getHistory(documentId, owner): Promise<MessageDTO[]>` — **now ownership-checked** (`findOwnedById`, not a bare existence check). This closes the previously-documented "chat history isn't tenant-scoped" gap.

## Source
`server/src/services/chat.service.ts`

## Dependencies
- Imports: [[document.repository]], [[message.repository]], [[ai.service|ai/ai.service.ts]], [[pinecone.service]], `ownerNamespace` from `utils/owner.ts`, `buildQAPrompt` from [[templates]], `AppError`, constants.
- Called by: [[chat.controller]] (`sendMessage`, `streamMessage`, `getChatHistory`), each of which now passes `req.owner`.

## Related
- [[chat.controller]]
- [[templates]]
- [[ai.service]]
- [[pinecone.service]]
- [[Data-Flow#2. Chat message flow]]
- [[Known-Issues-and-Conventions#Chat history and commands are now tenant-scoped too (previously a known gap — closed)]]

## Notes
If a user's query has no matching Pinecone vectors, the request 400s rather than falling back to a "no context found" AI answer — deliberate, not a bug. Also worth knowing: this is the same namespace-mismatch failure mode as before, just with a different-shaped key — if a document was uploaded under one `ownerNamespace` and queried under another (shouldn't happen now that both derive from the same `owner`, but could if `RequestOwner.id` ever changes for an owner, e.g. re-migrating a guest twice), chat will fail with "No document content available for context" even though the document processed successfully.
