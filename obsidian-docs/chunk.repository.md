---
tags: [backend, repository]
---
## Purpose
Direct Prisma access for the `Chunk` table.

## Key Details
- `class ChunkRepository`, singleton export `chunkRepository`.
- `createMany(documentId, chunks: Array<{ chunkIndex, text, tokenCount }>): Promise<number>` — bulk insert via `prisma.chunk.createMany`, returns inserted count.
- `findByDocumentId(documentId): Promise<Chunk[]>` — `orderBy: chunkIndex asc`.
- `deleteByDocumentId(documentId): Promise<number>` — bulk delete, returns deleted count.

## Source
`server/src/repositories/chunk.repository.ts`

## Dependencies
- Imports: `prisma` from `db.ts`.
- Used by: [[processing.service]] (`createMany` after chunking/embedding), [[command.service]] (`findByDocumentId` to build prompts from all chunk text).

## Related
- [[Model-Chunk]]
- [[processing.service]]
- [[command.service]]

## Notes
No method here reads or filters by `clientId` — chunk access control is entirely upstream (whatever already validated the `documentId` belongs to the caller before reaching this repository). `deleteByDocumentId` is defined but not actually called anywhere outside of what Prisma's cascade delete already handles on `Document` deletion — it exists as an available primitive, not part of the current delete flow.
