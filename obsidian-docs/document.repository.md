---
tags: [backend, repository]
---
## Purpose
Direct Prisma access for the `Document` table — no business logic, ownership checks are explicit single-purpose methods rather than implicit in every query.

## Key Details
- `class DocumentRepository`, singleton export `documentRepository`.
- `create(data: { title, fileName, fileSize, storageKey?, owner: RequestOwner }): Promise<Document>` — sets `userId`/`guestSessionId` from `owner.type` (exactly one is set, never both), `status: PENDING`.
- `findAll(owner): Promise<Document[]>` / `findRecent(owner, limit = 5): Promise<Document[]>` — both filter by `{ userId: owner.id }` or `{ guestSessionId: owner.id }` depending on `owner.type` (helper `ownerWhere(owner)`); `findRecent` orders by `lastAccessedAt desc` instead of `createdAt desc`.
- `findById(id): Promise<Document | null>` — plain `findUnique`, **still no ownership filter** (unchanged from before).
- `findOwnedById(id, owner): Promise<Document | null>` (**new** — the method every service should call) — `findById` then checks `doc.userId !== owner.id` / `doc.guestSessionId !== owner.id` depending on `owner.type`, returning `null` on mismatch instead of the document.
- `touchAccessed(id): Promise<void>` (**new**) — sets `lastAccessedAt: new Date()`. Called by [[document.service]]`.getById` on every successful fetch.
- `updateStorageKey(id, storageKey): Promise<Document>` (**new**) — currently unused (storageKey is set at `create` time instead), kept for a future "attach a file after the fact" path.
- `updateStatus`/`updateProcessingResult`/`delete` — unchanged.
- `migrateGuestDocuments(guestSessionId, userId): Promise<number>` (**new**) — `updateMany({ where: { guestSessionId }, data: { userId, guestSessionId: null } })`. This single call is the entire "guest data merges into your account" feature — see [[auth.service]].

## Source
`server/src/repositories/document.repository.ts`

## Dependencies
- Imports: `prisma` from `db.ts`, `DOCUMENT_STATUS`, `RequestOwner` type.
- Used by: [[document.service]] (all methods), [[chat.service]]/[[command.service]] (`findOwnedById`), [[processing.service]] (`updateStatus`, `findById`, `updateProcessingResult`), [[auth.service]] (`migrateGuestDocuments`).

## Related
- [[Model-Document]]
- [[document.service]]
- [[auth.service]]
- [[Known-Issues-and-Conventions#Document queries must stay scoped per owner (`RequestOwner`, not a raw string)]]

## Notes
`findById` is intentionally still unscoped — it's a low-level primitive used internally (e.g. by `migrateGuestDocuments`'s bulk update, which doesn't need per-row ownership checks). The rule going forward: any code path that hands a `Document` back to an external caller (a controller response) must go through `findOwnedById`, never bare `findById`. This mirrors the exact gap that `47d92bf` originally fixed for `findAll` — don't reintroduce it for a new method by reaching for `findById` out of convenience.
