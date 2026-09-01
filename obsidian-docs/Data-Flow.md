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
5. [[document.controller]] (`server/src/controllers/document.controller.ts`) — reads `req.owner` (set by [[guest-session.middleware]] + [[auth.middleware]]), calls `documentService.upload(file, req.owner)`.
6. [[document.service]] (`server/src/services/document.service.ts`) — `b2StorageService.uploadPdf(file.data, file.name)` (original PDF → Backblaze B2, if configured — see [[b2-storage.service]]) → `documentRepository.create({ ..., storageKey, owner })` (status `pending`) → **awaits** `processDocumentAsync(doc.id, file.data, owner)`.
7. [[processor]] (`server/src/workers/processor.ts:4`) — calls and returns the promise from `processingService.processDocument(...)`.
8. [[processing.service]] (`server/src/services/processing.service.ts:11`, `processDocument`):
   a. `documentRepository.updateStatus(id, PROCESSING)`.
   b. `unpdf`'s `getDocumentProxy` + `extractText` → raw `text`, `totalPages`.
   c. OCR gate: `text.trim().length < 50` → `updateStatus(id, OCR_REQUIRED, ...)`, return early.
   d. [[processor|chunkText()]] (`server/src/utils/chunker.ts:21`) — splits into ~512-token chunks with 50-token overlap.
   e. [[ai.service]]`.generateEmbeddings(texts)` → [[gemini.provider]]`.generateEmbeddings` → Gemini `batchEmbedContents`.
   f. [[chunk.repository]]`.createMany(...)` — chunk text/tokenCount/index into Postgres (`Chunk` — [[Model-Chunk]]).
   g. [[pinecone.service]]`.upsertChunks(documentId, chunks, ownerNamespace(owner))` — embeddings into Pinecone, namespaced by `u_<userId>`/`g_<guestSessionId>` (`utils/owner.ts`).
   h. `documentRepository.updateProcessingResult(id, { pageCount, status: COMPLETED })`. (Any exception anywhere in a–h → `updateStatus(id, FAILED, error.message)`.)
9. Back in [[document.service]]`.upload()` — re-fetches the document (now `completed`/`failed`/`ocr_required`), returns its DTO.
10. HTTP response `201` reaches [[documentApi]]'s mutation → [[UploadModal]] also does `savePDF(doc.id, file)` ([[pdfStorage]]) to cache the raw binary locally, then `toast.success`, closes the dialog.
11. `invalidatesTags: ['Document']` on the mutation triggers [[DocumentList]]'s `getDocuments` query to refetch and show the new card.

### 2. Chat message flow
1. [[ChatInput]] (`client/src/components/chat/ChatInput.tsx:21`) — Enter/submit → `onSendMessage(input)`.
2. [[ChatInterface]] passes [[useChat]]'s `sendMessage` as that handler.
3. [[useChat]] (`client/src/hooks/useChat.ts`, `sendMessage`) — optimistically appends a user + empty streaming-assistant message locally, then `fetch('/documents/:id/chat/stream?message=...', { credentials: 'include', headers: { Authorization: 'Bearer <accessToken>' } })` and reads the response body as a stream manually (not `EventSource` — see [[useChat]] Notes for why).
4. [[chat.routes]] (`server/src/routes/chat.routes.ts`) — `GET /stream` → [[chat.controller]]`.streamMessage`.
5. [[chat.controller]] (`server/src/controllers/chat.controller.ts`) — writes SSE headers, calls `chatService.streamMessage(documentId, message, onChunk, req.owner)` where `onChunk` writes `data: <chunk>\n\n`.
6. [[chat.service]] (`server/src/services/chat.service.ts`, `streamMessage` → shared `prepareChat`):
   a. `documentRepository.findOwnedById(documentId, owner)` — throws 404 if not found/not owned; require `status === COMPLETED`.
   b. `messageRepository.create({ role: USER, content: userMessage })` — saved immediately.
   c. [[ai.service]]`.generateEmbedding(userMessage)` → [[pinecone.service]]`.querySimilar(documentId, embedding, TOP_K_CHUNKS=5, ownerNamespace(owner))`.
   d. Fetch prior messages, take last 6 (excluding the just-saved user row) as history.
   e. [[templates]]`.buildQAPrompt(question, contextTexts, history)`.
   f. `aiService.chatCompletionStream({ messages })` → [[gemini.provider]]`.chatCompletionStream` (with model-fallback on 429/503/404) → yields token chunks.
   g. Each yielded chunk is forwarded via `onChunk` (step 5) as an SSE event; full text accumulated.
   h. After the stream ends: `messageRepository.create({ role: ASSISTANT, content: fullResponse })`.
7. Controller writes `data: [DONE]\n\n`, ends the response.
8. [[useChat]]'s stream reader sees `[DONE]` → stops reading, dispatches `chatApi.util.invalidateTags([{ type: 'Message', id: documentId }])`.
9. [[chatApi]]'s `getChatHistory` query (tagged `Message:{id}`) refetches from `GET /api/documents/:documentId/chat` → [[chat.service]]`.getHistory` (**now ownership-checked**, closing the gap this note used to flag) → returns full persisted history.
10. `useChat`'s `useEffect` on `[history]` clears the local optimistic `messages`, and [[ChatMessage]] renders each persisted turn via `ReactMarkdown`.

### 3. Document list/view flow
1. [[DocumentList]] (`client/src/components/documents/DocumentList.tsx:7`) → `useGetDocumentsQuery()` ([[documentApi]]).
2. `GET /api/documents` → [[document.routes]] → [[document.controller]]`.listDocuments` → [[document.service]]`.list(req.owner)` → [[document.repository]]`.findAll(owner)` → Prisma → Postgres (`documents` table, filtered by `userId` or `guestSessionId` depending on `owner.type`, ordered `createdAt desc`).
3. Mapped to `DocumentDTO[]`, rendered as [[DocumentCard]] tiles.
4. Clicking a card navigates to `/documents/:id` → [[DocumentPage]] → `useGetDocumentQuery(id)` → `GET /api/documents/:id` → [[document.service]]`.getById` (always ownership-checked via `findOwnedById`, plus bumps `lastAccessedAt`) → [[document.repository]] → Prisma → Postgres.
5. [[DocumentHeader]] and [[PDFViewer]] independently consume the same `documentId`; `PDFViewer` does **not** hit this API — it reads the PDF binary from local IndexedDB via [[pdfStorage]] (a server copy exists via [[b2-storage.service]]/`GET /api/documents/:id/file`, but nothing on the frontend calls it yet).

### 3b. Recent documents flow (new — replaces the old localStorage version)
1. [[AppSidebar]] → [[useRecentDocuments]] → `useGetRecentDocumentsQuery()` ([[documentApi]]).
2. `GET /api/documents/recent` → [[document.controller]]`.listRecentDocuments` → [[document.service]]`.listRecent(req.owner, 5)` → [[document.repository]]`.findRecent(owner, 5)` — same owner-filtering as the list flow above, but `orderBy: lastAccessedAt desc, take: 5`.
3. There is no separate "record a visit" call anymore — `lastAccessedAt` is bumped as a side effect of step 4 in flow 3 above (viewing a document *is* recording a visit), so this flow only ever reads.

### 4. Auth / identity flow
See [[Auth-System]] for the full architecture (tables, token lifetimes, CSRF, guest-merge-on-login). Short version:
1. **Every** request gets an owner before it reaches a route handler: [[guest-session.middleware]] reads/issues a signed httpOnly `dociq_guest_id` cookie and sets `req.owner = { type: 'guest', id }`; [[auth.middleware]] then upgrades `req.owner` to `{ type: 'user', ... }` if a valid `Authorization: Bearer <accessToken>` header is present.
2. On the client, [[AuthContext]] calls `/auth/refresh` once on mount to try to restore a user session from the httpOnly refresh cookie; the resulting short-lived access token is kept **in memory only** (`client/src/lib/token-store.ts`), never `localStorage`.
3. [[baseApi]] attaches that access token as `Authorization: Bearer ...` and the CSRF cookie value as `x-csrf-token` on every request, and transparently refreshes-and-retries once on a `401`.
4. Login/register ([[auth.service]]) additionally call `documentRepository.migrateGuestDocuments(guestSessionId, userId)` using the request's guest cookie — this is the entire "guest work follows you into your account" mechanism, no explicit user action required.
5. There is no more raw, client-chosen identity string anywhere in this flow — contrast with the old `clientId` model (a value the *browser* generated and the server merely trusted), which is what [[Known-Issues-and-Conventions]] describes as the fixed vulnerability.

### 5. Command flow
1. [[DocumentHeader]] (`client/src/components/documents/DocumentHeader.tsx`, `handleCommand`) — Actions dropdown item click → opens result dialog, calls `executeCommand({ documentId, command }).unwrap()` ([[commandApi]]).
2. `POST /api/commands` → [[command.routes]] (`aiLimiter` → `validate(commandSchema)`) → [[command.controller]]`.executeCommand` (reads `req.owner`, previously had no identity handling at all in this path).
3. [[command.service]]`.execute(documentId, command, owner, regenerate)`:
   a. Validate `command` is in `ARTIFACT_TYPES`; `findOwnedById(documentId, owner)` (now ownership-checked); require `status === COMPLETED`.
   b. If `!regenerate`: [[ai-artifact.repository]]`.findByDocumentAndType` — cache hit returns immediately.
   c. Cache miss: [[chunk.repository]]`.findByDocumentId` (all chunks, no truncation) → [[templates]] prompt builder (`buildSummaryPrompt`/`buildKeyPointsPrompt`/`buildInsightsPrompt`, or summary as a fallback for any other type) → [[ai.service]]`.chatCompletion` → [[gemini.provider]] (with fallback cascade) → [[ai-artifact.repository]]`.upsert(documentId, command, content)`.
4. Response `{ success: true, data: AIArtifactDTO }` → [[DocumentHeader]] sets `commandResult`, renders via `ReactMarkdown` in the dialog; `invalidatesTags: [{ type: 'AIArtifact', id: documentId }]` on the mutation.

## Source
Cross-reference of all files named above.

## Dependencies
See per-step links.

## Related
- [[API-Contract]]
- [[Backend-Architecture]]
- [[Frontend-Architecture]]
- [[Auth-System]]
- [[Known-Issues-and-Conventions]]

## Notes
Flows 1 and 5 are both fully synchronous request/response despite calling an LLM — there is no queue, webhook, or polling anywhere in this app. Flow 2 is the only one that streams (now via `fetch` + manual reading, not `EventSource` — see [[useChat]]). Flow 4 used to be the one place the codebase most diverged from what a fresh reader might assume (real Supabase auth, when it was actually just a trusted `clientId`) — that gap is closed now; identity is server-issued and cookie/token-based end to end. Still true: `lib/supabase.ts`/`lib/user.ts` (client) remain unused dead code unrelated to the real auth flow.
