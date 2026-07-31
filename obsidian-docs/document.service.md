---
tags: [backend, service]
---
## Purpose
Business logic for document lifecycle: upload orchestration, listing, ownership-checked fetch/delete, DTO mapping.

## Key Details
- `class DocumentService`, singleton export `documentService`. Local `toDTO(doc: Document): DocumentDTO` maps Prisma model → API shape (drops `clientId`, ISO-stringifies dates).
- `upload(file: UploadedFile, clientId?): Promise<DocumentDTO>`:
  1. `documentRepository.create({ title: file.name, fileName: file.name, fileSize: file.size, clientId })` — row starts `status: pending`.
  2. `await processDocumentAsync(doc.id, file.data, clientId)` — **awaited synchronously**, i.e. the HTTP response does not return until the entire extraction/chunking/embedding/Pinecone pipeline finishes or fails (see [[processor]] Notes on why — Vercel serverless compatibility).
  3. Re-fetches the document (`findById`) to get the final `status`/`pageCount` and returns its DTO.
- `list(clientId?): Promise<DocumentDTO[]>` — `documentRepository.findAll(clientId)` (returns `[]` if no clientId), mapped to DTOs.
- `getById(id, clientId?): Promise<DocumentDTO>` — fetch by id, then `if (!doc || (clientId && doc.clientId !== clientId)) throw AppError('Document not found', 404)`. **This is the ownership check** — note it only enforces the mismatch when a `clientId` was actually supplied by the caller; if `clientId` is `undefined` the check is skipped entirely and any document is returned.
- `delete(id, clientId?): Promise<void>` — same ownership check, then `pineconeService.deleteByDocumentId(id, clientId)` **before** `documentRepository.delete(id)` (Postgres cascade handles chunks/messages/artifacts; Pinecone needs its own explicit delete call).
- `getProcessingStatus(id, clientId?)` — same ownership-check pattern; returns `{ status, errorMsg }`. Not currently called from any controller (no polling endpoint exists — see [[API-Contract]]).

## Source
`server/src/services/document.service.ts`

## Dependencies
- Imports: [[document.repository]], [[message.repository]] (imported, unused in this file — dead import), [[ai-artifact.repository]] (imported, unused — dead import), [[pinecone.service]], `processDocumentAsync` from [[processor|workers/processor.ts]], `AppError`, [[logger]] (imported, unused — dead import).
- Called by: [[document.controller]] (all four public methods).

## Related
- [[document.controller]]
- [[document.repository]]
- [[processor]]
- [[pinecone.service]]
- [[Data-Flow#1. Upload flow]]
- [[Known-Issues-and-Conventions#Document queries must stay scoped per client]]

## Notes
The ownership check pattern (`clientId && doc.clientId !== clientId`) means an **absent** `clientId` on the request bypasses tenant scoping entirely rather than failing closed — this is intentional-looking (supports anonymous/no-header callers) but means a request with a missing/stripped `x-client-id` header can read/delete *any* document by guessing its numeric ID. Don't "simplify" this check to always require a match; that would break callers that legitimately have no clientId, but be aware of the security implication if you touch it. See [[Known-Issues-and-Conventions]].
