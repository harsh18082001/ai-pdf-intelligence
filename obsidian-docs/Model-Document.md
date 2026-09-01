---
tags: [backend, model]
---
## Purpose
Prisma model for an uploaded PDF: metadata, processing status, the owning user or guest session, and (optionally) a pointer to the original file in object storage.

## Key Details
```prisma
model Document {
  id             Int       @id @default(autoincrement())
  title          String
  fileName       String
  fileSize       Int
  pageCount      Int       @default(0)
  status         String    @default("pending") // pending, processing, completed, failed, ocr_required
  errorMsg       String?
  userId         String?
  guestSessionId String?
  storageKey     String?
  lastAccessedAt DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user      User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
  chunks    Chunk[]
  messages  Message[]
  artifacts AIArtifact[]

  @@index([userId])
  @@index([guestSessionId])
  @@map("documents")
}
```
- `clientId` is **gone** — replaced by `userId` (FK to [[Model-User]]) and `guestSessionId` (a signed id from [[guest-session.middleware]], not a relation — guests have no row anywhere). Exactly one of the two is set per document; both nullable so a plain `Document` row still type-checks with neither during, e.g., a migration window.
- `storageKey` (**new**) — the Backblaze B2 object key for the original PDF, set at upload time by [[document.service]] via [[b2-storage.service]]. `null` if B2 wasn't configured when the document was uploaded (dev without B2 credentials, or uploaded before this field existed).
- `lastAccessedAt` (**new**, defaults to `now()`) — bumped by [[document.repository]]`.touchAccessed()` every time [[document.service]]`.getById` is called. This is the entire "recent documents" feature now — see [[useRecentDocuments]].
- `status` is still a free-form `String` (`DOCUMENT_STATUS` constant), not a Prisma enum.
- Cascading deletes unchanged for `Chunk`/`Message`/`AIArtifact`. `User` relation is also `onDelete: Cascade` — deleting a user deletes their documents (and transitively their chunks/messages/artifacts).

## Source
`server/prisma/schema.prisma` (Document model)

## Dependencies
- Read/written by: [[document.repository]] (all methods), [[auth.service]] (`migrateGuestDocuments` reassigns `userId`/`guestSessionId`).
- Referenced (FK) by: [[Model-Chunk]], [[Model-Message]], [[Model-AIArtifact]], and now referencing [[Model-User]] itself.
- Surfaced to the client as `DocumentDTO` — adds `lastAccessedAt`, still omits `userId`/`guestSessionId`/`storageKey`/`errorMsg` from the list/get DTO mapping in [[document.service]]`.toDTO()`.

## Related
- [[document.repository]]
- [[document.service]]
- [[Model-User]]
- [[Model-Session]]
- [[b2-storage.service]]
- [[Model-Chunk]]
- [[Model-Message]]
- [[Model-AIArtifact]]
- [[Known-Issues-and-Conventions#Document queries must stay scoped per owner (`RequestOwner`, not a raw string)]]

## Notes
`findById(id)` in [[document.repository]] still does **not** filter by owner — that's now `findOwnedById`, a separate method every service calls explicitly. The migration from `clientId` to `userId`/`guestSessionId` was a clean cut, not a backwards-compatible rename: there is no code anywhere that reads a `clientId` column or header anymore (see [[Known-Issues-and-Conventions]]).
