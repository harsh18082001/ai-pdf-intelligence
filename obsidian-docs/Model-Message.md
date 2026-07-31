---
tags: [backend, model]
---
## Purpose
Prisma model for one chat turn (user, assistant, or system) attached to a document.

## Key Details
```prisma
model Message {
  id         Int      @id @default(autoincrement())
  documentId Int
  role       String   // user, assistant, system
  content    String
  createdAt  DateTime @default(now())

  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId])
  @@map("messages")
}
```
- Table: `messages`. Indexed on `documentId`. Ordered by `createdAt asc` in `findByDocumentId`.
- `role` is a free-form `String`; app-level allowed values are `MESSAGE_ROLES.USER | ASSISTANT | SYSTEM` in `config/constants.ts`. No `system`-role messages are actually ever created by the current chat flow ([[chat.service]] only writes `user`/`assistant`) — the `system` role exists in the type/schema for future use and is filtered out client-side in [[ChatMessage]] (`role === 'system'` → render nothing).
- No `updatedAt` — messages are immutable once created (no update method exists on [[message.repository]]).

## Source
`server/prisma/schema.prisma` (Message model)

## Dependencies
- Read/written by: [[message.repository]] (`create`, `findByDocumentId`, `deleteByDocumentId`).
- Written during: [[chat.service]]`.sendMessage`/`streamMessage` (one `user` row + one `assistant` row per turn) and `prepareChat` (the user row, before the AI call).
- Read during: [[chat.service]]`.getHistory` and `prepareChat` (last 6 prior messages become chat-history context in the prompt).

## Related
- [[message.repository]]
- [[chat.service]]
- [[Model-Document]]
- [[Data-Flow#2. Chat message flow]]

## Notes
`prepareChat` saves the user message to the DB **before** calling the AI, then fetches `findByDocumentId` and does `.slice(0, -1)` to drop that just-saved row back out before building history context — so if you add a new message-writing path, remember this "save-then-immediately-exclude" pattern only works because the user row is always the most recent one at that point; concurrent writes for the same document would break the assumption.
