---
tags: [backend, repository]
---
## Purpose
Direct Prisma access for the `Message` table.

## Key Details
- `class MessageRepository`, singleton export `messageRepository`.
- `create(data: { documentId, role, content }): Promise<Message>`.
- `findByDocumentId(documentId): Promise<Message[]>` — `orderBy: createdAt asc`.
- `deleteByDocumentId(documentId): Promise<number>`.

## Source
`server/src/repositories/message.repository.ts`

## Dependencies
- Imports: `prisma` from `db.ts`.
- Used by: [[chat.service]] (`create` for both user and assistant turns, `findByDocumentId` in `prepareChat` and `getHistory`).

## Related
- [[Model-Message]]
- [[chat.service]]

## Notes
No ownership filtering here either — same pattern as the other repositories; enforcement is the calling service's job. [[chat.service]]`.getHistory` now does this correctly ([[document.repository]]`.findOwnedById` before ever reaching this repository) — the previously-documented gap where history reads skipped that check is closed, see [[chat.controller]].
