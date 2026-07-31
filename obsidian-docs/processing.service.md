---
tags: [backend, service]
---
## Purpose
The document ingestion pipeline: extract text → OCR-check → chunk → embed → persist to Postgres + Pinecone → mark completed/failed. Called by (and effectively is) the "worker".

## Key Details
- `class ProcessingService`, singleton export `processingService`.
- `processDocument(documentId, fileBuffer: Buffer, clientId?): Promise<void>` — wraps the entire pipeline in one `try/catch`; **any thrown error results in `documentRepository.updateStatus(documentId, FAILED, error.message)`** rather than propagating, so callers never see a rejected promise reflecting pipeline failure (only pre-pipeline errors like a missing document would throw synchronously before the try block — in practice there are none, so this method effectively never rejects).
- Steps inside the try:
  1. `documentRepository.updateStatus(documentId, PROCESSING)`.
  2. Re-fetch the document; throw `Error` (caught below) if somehow not found.
  3. `getDocumentProxy(new Uint8Array(fileBuffer))` + `extractText(pdf, { mergePages: true })` from `unpdf` → `{ text, totalPages }`.
  4. **OCR gate**: `if (!text || text.trim().length < 50)` → `updateStatus(documentId, OCR_REQUIRED, "This PDF appears to contain scanned pages...")`, logs a warning, and `return`s early (does not throw — this is a normal, non-error exit path).
  5. `chunkText(text)` from [[processor|utils/chunker.ts]] (default `CHUNK_SIZE=512`, `CHUNK_OVERLAP=50`).
  6. `aiService.generateEmbeddings(texts)` — one embedding call for all chunk texts at once (Gemini's `batchEmbedContents` under the hood via [[gemini.provider]]).
  7. `chunkRepository.createMany(documentId, dbChunks)` — chunk text/tokenCount/index only, no embeddings, into Postgres.
  8. `pineconeService.upsertChunks(documentId, pineconeChunks, clientId)` — chunk text + embedding + index, into Pinecone (namespaced by `clientId` if present).
  9. `documentRepository.updateProcessingResult(documentId, { pageCount: totalPages, status: COMPLETED })`.
- On any exception: logs it, sets `status: FAILED` with `error.message` as `errorMsg`.

## Source
`server/src/services/processing.service.ts`

## Dependencies
- Imports: `getDocumentProxy`, `extractText` from `unpdf`, [[document.repository]], [[chunk.repository]], [[ai.service]], `chunkText` from [[processor|utils/chunker.ts]], [[pinecone.service]], [[logger]], `DOCUMENT_STATUS`.
- Called by: `processDocumentAsync` in [[processor|workers/processor.ts]] (the only caller).

## Related
- [[processor]]
- [[processor#chunkText]]
- [[pinecone.service]]
- [[ai.service]]
- [[Model-Document]]
- [[Model-Chunk]]
- [[Data-Flow#1. Upload flow]]

## Notes
Steps 7 and 8 (Postgres chunk insert, Pinecone upsert) are **not transactional with each other** — if the Pinecone upsert throws after the Postgres `createMany` already succeeded, the `catch` block marks the whole document `FAILED`, but the chunk rows remain in Postgres (orphaned, since the document is now `FAILED` not `COMPLETED`, and nothing currently cleans these up). If you change the pipeline order or add retries, be aware there's no compensating cleanup for partial writes. OCR detection is a crude length check (`< 50` chars of extracted text), not real scanned-page detection — a very short but genuinely text-based PDF would also be misclassified as needing OCR.
