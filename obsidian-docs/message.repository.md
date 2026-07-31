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
No ownership/clientId filtering here either — same pattern as the other repositories; enforcement is the calling service's job (and [[chat.service]]`.getHistory` currently does **not** enforce it — see [[chat.controller]] Notes).
