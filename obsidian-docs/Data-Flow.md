---
tags: [architecture]
---
## Purpose
File-by-file traces of the five core flows in the app, with exact call sites.

## Key Details

### 1. Upload flow
1. [[UploadDropzone]] (`client/src/components/documents/UploadDropzone.tsx:46`, `handleUpload`) — user drops/selects a PDF, clicks "Process Document" → calls `onFileSelect(selectedFile)`.
2. [[UploadModal]] (`client/src/components/documents/UploadModal.tsx:20`, `handleUpload`) — `uploadDocument(file).unwrap()`.
3. [[documentApi]] (`client/src/api/documentApi.ts:16`, `uploadDocument` mutation) — builds `FormData`, `POST /api/documents`.
4. [[document.routes]] (`server/src/routes/document.routes.ts:18`) — `uploadPdf` middleware ([[upload]]) validates file, then [[document.controller]]`.uploadDocument`.
5. [[document.controller]] (`server/src/controllers/document.controller.ts:23`) — reads `clientId`, calls `documentService.upload(file, clientId)`.
6. [[document.service]] (`server/src/services/document.service.ts:26`) — `documentRepository.create(...)` (status `pending`) → **awaits** `processDocumentAsync(doc.id, file.data, clientId)`.
7. [[processor]] (`server/src/workers/processor.ts:4`) — calls and returns the promise from `processingService.processDocument(...)`.
8. [[processing.service]] (`server/src/services/processing.service.ts:11`, `processDocument`):
   a. `documentRepository.updateStatus(id, PROCESSING)`.
   b. `unpdf`'s `getDocumentProxy` + `extractText` → raw `text`, `totalPages`.
   c. OCR gate: `text.trim().length < 50` → `updateStatus(id, OCR_REQUIRED, ...)`, return early.
   d. [[processor|chunkText()]] (`server/src/utils/chunker.ts:21`) — splits into ~512-token chunks with 50-token overlap.
   e. [[ai.service]]`.generateEmbeddings(texts)` → [[gemini.provider]]`.generateEmbeddings` → Gemini `batchEmbedContents`.
   f. [[chunk.repository]]`.createMany(...)` — chunk text/tokenCount/index into Postgres (`Chunk` — [[Model-Chunk]]).
   g. [[pinecone.service]]`.upsertChunks(documentId, chunks, clientId)` — embeddings into Pinecone, namespaced by `clientId`.
   h. `documentRepository.updateProcessingResult(id, { pageCount, status: COMPLETED })`. (Any exception anywhere in a–h → `updateStatus(id, FAILED, error.message)`.)
9. Back in [[document.service]]`.upload()` — re-fetches the document (now `completed`/`failed`/`ocr_required`), returns its DTO.
10. HTTP response `201` reaches [[documentApi]]'s mutation → [[UploadModal]] also does `savePDF(doc.id, file)` ([[pdfStorage]]) to cache the raw binary locally, then `toast.success`, closes the dialog.
11. `invalidatesTags: ['Document']` on the mutation triggers [[DocumentList]]'s `getDocuments` query to refetch and show the new card.

### 2. Chat message flow
1. [[ChatInput]] (`client/src/components/chat/ChatInput.tsx:21`) — Enter/submit → `onSendMessage(input)`.
2. [[ChatInterface]] passes [[useChat]]'s `sendMessage` as that handler.
3. [[useChat]] (`client/src/hooks/useChat.ts:31`, `sendMessage`) — optimistically appends a user + empty streaming-assistant message locally, opens `new EventSource('/documents/:id/chat/stream?message=...&clientId=...')`.
4. [[chat.routes]] (`server/src/routes/chat.routes.ts:13`) — `GET /stream` → [[chat.controller]]`.streamMessage`.
5. [[chat.controller]] (`server/src/controllers/chat.controller.ts:41`) — writes SSE headers, calls `chatService.streamMessage(documentId, message, onChunk, clientId)` where `onChunk` writes `data: <chunk>\n\n`.
6. [[chat.service]] (`server/src/services/chat.service.ts:75`, `streamMessage` → shared `prepareChat` at line 11):
   a. Fetch + ownership-check the document; require `status === COMPLETED`.
   b. `messageRepository.create({ role: USER, content: userMessage })` — saved immediately.
   c. [[ai.service]]`.generateEmbedding(userMessage)` → [[pinecone.service]]`.querySimilar(documentId, embedding, TOP_K_CHUNKS=5, clientId)`.
   d. Fetch prior messages, take last 6 (excluding the just-saved user row) as history.
   e. [[templates]]`.buildQAPrompt(question, contextTexts, history)`.
   f. `aiService.chatCompletionStream({ messages })` → [[gemini.provider]]`.chatCompletionStream` (with model-fallback on 429/503/404) → yields token chunks.
   g. Each yielded chunk is forwarded via `onChunk` (step 5) as an SSE event; full text accumulated.
   h. After the stream ends: `messageRepository.create({ role: ASSISTANT, content: fullResponse })`.
7. Controller writes `data: [DONE]\n\n`, ends the response.
8. [[useChat]]'s `EventSource.onmessage` sees `[DONE]` → closes the connection, dispatches `chatApi.util.invalidateTags([{ type: 'Message', id: documentId }])`.
9. [[chatApi]]'s `getChatHistory` query (tagged `Message:{id}`) refetches from `GET /api/documents/:documentId/chat` → [[chat.service]]`.getHistory` (⚠️ **no ownership check** — see [[Known-Issues-and-Conventions]]) → returns full persisted history.
10. `useChat`'s `useEffect` on `[history]` clears the local optimistic `messages`, and [[ChatMessage]] renders each persisted turn via `ReactMarkdown`.

### 3. Document list/view flow
1. [[DocumentList]] (`client/src/components/documents/DocumentList.tsx:7`) → `useGetDocumentsQuery()` ([[documentApi]]).
2. `GET /api/documents` → [[document.routes]] → [[document.controller]]`.listDocuments` → [[document.service]]`.list(clientId)` → [[document.repository]]`.findAll(clientId)` (`[]` if no clientId) → Prisma → Postgres (`documents` table, filtered `clientId`, ordered `createdAt desc`).
3. Mapped to `DocumentDTO[]`, rendered as [[DocumentCard]] tiles.
4. Clicking a card navigates to `/documents/:id` → [[DocumentPage]] → `useGetDocumentQuery(id)` → `GET /api/documents/:id` → [[document.service]]`.getById` (ownership-checked if clientId present) → [[document.repository]]`.findById` → Prisma → Postgres.
5. [[MetadataPanel]] and [[PDFViewer]] independently consume the same `documentId`; `PDFViewer` does **not** hit this API — it reads the PDF binary from local IndexedDB via [[pdfStorage]] only.

### 4. Auth / identity flow
1. `main.tsx` calls `getStoredClientId()` ([[AuthContext]]) at module scope, before rendering — reads/creates `localStorage['dociq_client_id']` (`'usr_' + crypto.randomUUID()` if absent).
2. `<AuthProvider>` ([[AuthContext]]) wraps the app and exposes this value via `useAuth()` — **but nothing actually calls `useAuth()`**; it's mounted but not consumed.
3. Real propagation is direct `localStorage` reads at two call sites: [[baseApi]]'s `prepareHeaders` (sets `x-client-id` header on every RTK Query request) and [[useChat]] (appends `?clientId=...` to the raw `EventSource` URL, since that bypasses `baseApi`).
4. Backend: each controller's local `getClientId(req)` helper ([[document.controller]], [[chat.controller]] — duplicated, not shared) reads `req.headers['x-client-id']` → `req.query.clientId` → `req.body?.clientId`, first non-empty wins.
5. That string is passed down as `clientId` through service → repository/Pinecone-namespace calls, and used as an equality check against `Document.clientId` for ownership (inconsistently — see [[Known-Issues-and-Conventions]]).
6. There is no session, no token, no expiry, no server-side identity store — the `clientId` string itself, as sent by the client, **is** the identity. `lib/supabase.ts`/`lib/user.ts` (client) are unused dead code that could be mistaken for part of this flow — they are not wired in.

### 5. Command flow
1. [[MetadataPanel]] (`client/src/components/documents/MetadataPanel.tsx:36`, `handleCommand`) — button click → opens result dialog, calls `executeCommand({ documentId, command }).unwrap()` ([[commandApi]]).
2. `POST /api/commands` → [[command.routes]] (`aiLimiter` → `validate(commandSchema)`) → [[command.controller]]`.executeCommand` (no clientId handling anywhere in this path).
3. [[command.service]]`.execute(documentId, command, regenerate)`:
   a. Validate `command` is in `ARTIFACT_TYPES`; fetch document (no ownership check); require `status === COMPLETED`.
   b. If `!regenerate`: [[ai-artifact.repository]]`.findByDocumentAndType` — cache hit returns immediately.
   c. Cache miss: [[chunk.repository]]`.findByDocumentId` (all chunks, no truncation) → [[templates]] prompt builder (`buildSummaryPrompt`/`buildKeyPointsPrompt`/`buildInsightsPrompt`, or summary as a fallback for any other type) → [[ai.service]]`.chatCompletion` → [[gemini.provider]] (with fallback cascade) → [[ai-artifact.repository]]`.upsert(documentId, command, content)`.
4. Response `{ success: true, data: AIArtifactDTO }` → [[MetadataPanel]] sets `commandResult`, renders via `ReactMarkdown` in the dialog; `invalidatesTags: [{ type: 'AIArtifact', id: documentId }]` on the mutation.

## Source
Cross-reference of all files named above.

## Dependencies
See per-step links.

## Related
- [[API-Contract]]
- [[Backend-Architecture]]
- [[Frontend-Architecture]]
- [[Known-Issues-and-Conventions]]

## Notes
Flows 1 and 5 are both fully synchronous request/response despite calling an LLM — there is no queue, webhook, or polling anywhere in this app. Flow 2 is the only one that streams. Flow 4 is the one place the codebase most diverges from what a fresh reader might assume (real Supabase auth) — always re-verify against [[AuthContext]] before building on top of it.
