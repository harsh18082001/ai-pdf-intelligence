---
tags: [backend, repository]
---
## Purpose
Direct Prisma access for the `Document` table — no business logic, no auth checks.

## Key Details
- `class DocumentRepository`, singleton export `documentRepository`.
- `create(data: { title, fileName, fileSize, clientId? }): Promise<Document>` — always sets `status: DOCUMENT_STATUS.PENDING` regardless of input.
- `findAll(clientId?): Promise<Document[]>` — **returns `[]` immediately if `clientId` is falsy/blank**, without querying the DB. Otherwise `where: { clientId: clientId.trim() }`, `orderBy: createdAt desc`.
- `findById(id): Promise<Document | null>` — plain `findUnique({ where: { id } })`, **no clientId filter at all**.
- `updateStatus(id, status, errorMsg?): Promise<Document>` — sets `status` and `errorMsg` (`null` if not given, clearing any prior error).
- `updateProcessingResult(id, { pageCount, status, errorMsg? }): Promise<Document>` — used at the end of processing to set final page count + status together.
- `delete(id): Promise<Document>` — plain `delete({ where: { id } })`; relies on Prisma cascade for children (see [[Model-Document]]).

## Source
`server/src/repositories/document.repository.ts`

## Dependencies
- Imports: `prisma` from [[processor|db.ts]], `DOCUMENT_STATUS` constant.
- Used by: [[document.service]] (all methods), [[chat.service]] (`findById` in `prepareChat`/`getHistory`), [[command.service]] (`findById`), [[processing.service]] (`updateStatus`, `findById`, `updateProcessingResult`).

## Related
- [[Model-Document]]
- [[document.service]]
- [[Known-Issues-and-Conventions#Document queries must stay scoped per client]]

## Notes
**This is the layer where the cross-user leakage bug (fixed in commit `47d92bf`) lived.** `findById` still has no ownership filter by design — every caller is expected to compare `doc.clientId` against the caller's `clientId` itself after fetching (as [[document.service]] does). If you add a new repository method that returns a `Document` by ID, do not assume it's tenant-safe — it isn't, and the calling service must enforce that.
