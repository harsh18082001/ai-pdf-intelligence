---
tags: [backend, model]
---
## Purpose
Prisma model for an uploaded PDF: metadata, processing status, and the tenancy key (`clientId`).

## Key Details
```prisma
model Document {
  id        Int      @id @default(autoincrement())
  title     String
  fileName  String
  fileSize  Int
  pageCount Int      @default(0)
  status    String   @default("pending") // pending, processing, completed, failed, ocr_required
  errorMsg  String?
  clientId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  chunks    Chunk[]
  messages  Message[]
  artifacts AIArtifact[]

  @@index([clientId])
  @@map("documents")
}
```
- Table name: `documents`. Indexed on `clientId` (the only non-PK index) — this is the tenancy-scoping query path.
- `status` is a free-form `String`, not a Prisma enum, but the app-level allowed values live in `DOCUMENT_STATUS` in `server/src/config/constants.ts`: `pending | processing | completed | failed | ocr_required`.
- `clientId` is **nullable** — a document created without a client ID is invisible to `findAll(clientId)` (see [[document.repository]]) since that query requires a non-empty `clientId` filter, but is still directly fetchable by numeric ID via `findById`.
- Cascading deletes: `Chunk`, `Message`, `AIArtifact` all declare `onDelete: Cascade` on their `document` relation, so deleting a `Document` row deletes all its children automatically — [[document.service]]`.delete()` relies on this and does not manually delete children.

## Source
`server/prisma/schema.prisma` (Document model)

## Dependencies
- Read/written by: [[document.repository]] (all methods).
- Referenced (FK) by: [[Model-Chunk]], [[Model-Message]], [[Model-AIArtifact]].
- Surfaced to the client as `DocumentDTO` — mapped in [[document.service]]`.toDTO()` (note: DTO omits `clientId` and `errorMsg` is dropped in the DTO mapping used by list/get, but present in the raw type).

## Related
- [[document.repository]]
- [[document.service]]
- [[Model-Chunk]]
- [[Model-Message]]
- [[Model-AIArtifact]]
- [[Known-Issues-and-Conventions#Document queries must stay scoped per client]]

## Notes
`findById(id)` in [[document.repository]] does **not** filter by `clientId` — ownership checks happen one layer up, in the *service* (`documentService.getById`/`delete` compare `doc.clientId !== clientId` after fetching). If you add a new repository method that fetches by ID, remember the repository itself provides no tenant isolation; the caller must enforce it, matching the fix from commit `47d92bf`.
