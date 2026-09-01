---
tags: [backend, service]
---
## Purpose
Business logic for document lifecycle: upload orchestration (including original-file storage), listing/recents, ownership-checked fetch/delete, DTO mapping.

## Key Details
- `class DocumentService`, singleton export `documentService`. Local `toDTO(doc: Document): DocumentDTO` maps Prisma model → API shape (adds `lastAccessedAt`, drops `userId`/`guestSessionId`/`storageKey`).
- `upload(file: UploadedFile, owner: RequestOwner): Promise<DocumentDTO>`:
  1. `b2StorageService.uploadPdf(file.data, file.name)` — uploads the original PDF to Backblaze B2 and returns a `storageKey` (or `null` if B2 isn't configured — see [[b2-storage.service]]).
  2. `documentRepository.create({ title, fileName, fileSize, storageKey, owner })` — row starts `status: pending`, with `userId`/`guestSessionId` set from `owner.type`.
  3. `await processDocumentAsync(doc.id, file.data, owner)` — **awaited synchronously** (Vercel serverless compatibility, see [[processor]]).
  4. Re-fetches the document and returns its DTO.
- `list(owner): Promise<DocumentDTO[]>` — `documentRepository.findAll(owner)`.
- `listRecent(owner, limit = 5): Promise<DocumentDTO[]>` (**new**) — `documentRepository.findRecent(owner, limit)`, ordered by `lastAccessedAt desc`. Backs `GET /api/documents/recent`, replacing the old client-only localStorage recents list — see [[useRecentDocuments]].
- `getById(id, owner): Promise<DocumentDTO>` — `documentRepository.findOwnedById(id, owner)` (throws 404 if not found *or* not owned — no bypass path), then **touches `lastAccessedAt`** (`documentRepository.touchAccessed(id)`) before returning. This is what makes "recent" tracking automatic: viewing a document is the only thing that updates it.
- `getFileUrl(id, owner): Promise<string>` (**new**) — ownership-checked fetch, 404 if no `storageKey`, else a presigned URL from [[b2-storage.service]] (503 if B2 isn't configured).
- `delete(id, owner): Promise<void>` — ownership-checked fetch, `pineconeService.deleteByDocumentId` + `b2StorageService.deletePdf` (if a `storageKey` exists) before `documentRepository.delete(id)`.
- `getProcessingStatus(id, owner)` — same ownership-checked pattern; still not called from any controller (no polling endpoint wired up client-side).
- `ownerNamespace(owner)` used to live in this file; it moved to `server/src/utils/owner.ts` to break a circular import ([[processing.service]] needs it too, and importing it from here created `document.service → processor → processing.service → document.service`).

## Source
`server/src/services/document.service.ts`

## Dependencies
- Imports: [[document.repository]], [[pinecone.service]], [[b2-storage.service]], `processDocumentAsync` from [[processor|workers/processor.ts]], `AppError`, `ownerNamespace` from `utils/owner.ts`.
- Called by: [[document.controller]] (all public methods).

## Related
- [[document.controller]]
- [[document.repository]]
- [[processor]]
- [[pinecone.service]]
- [[b2-storage.service]]
- [[Data-Flow#1. Upload flow]]
- [[Known-Issues-and-Conventions#Document queries must stay scoped per owner (`RequestOwner`, not a raw string)]]

## Notes
Unlike the old `clientId && doc.clientId !== clientId` check (which **skipped** the comparison entirely when `clientId` was absent), `findOwnedById` always requires a match against `owner.id` for `owner.type` — there is no "no owner, allow anything" bypass anymore, because every request always has *some* owner (a guest, at minimum — see [[guest-session.middleware]]).
