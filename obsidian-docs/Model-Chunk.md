---
tags: [backend, model]
---
## Purpose
Prisma model for one text chunk of a document's extracted content (the relational-DB copy; the corresponding embedding vector lives in Pinecone, not here).

## Key Details
```prisma
model Chunk {
  id         Int      @id @default(autoincrement())
  documentId Int
  chunkIndex Int
  text       String
  tokenCount Int

  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId])
  @@map("chunks")
}
```
- Table: `chunks`. Indexed on `documentId`.
- No embedding column — Postgres stores the raw `text`/`tokenCount`/order (`chunkIndex`) only; the 768-dim vector for the same `chunkIndex` is upserted separately into Pinecone with record ID `doc_{documentId}_chunk_{chunkIndex}` (see [[pinecone.service]]). The two stores are kept in sync only by both being written in [[processing.service]]'s pipeline — there is no transactional guarantee between them.
- `chunkIndex` and `text` come from [[processor|utils/chunker.ts]]'s `chunkText()` output (`ChunkResult { text, tokenCount, index }`).

## Source
`server/prisma/schema.prisma` (Chunk model)

## Dependencies
- Read/written by: [[chunk.repository]] (`createMany`, `findByDocumentId`, `deleteByDocumentId`).
- Written during: [[processing.service]]'s pipeline (`chunkRepository.createMany` after `chunkText()`).
- Read during: [[command.service]]`.execute()` (fetches all chunks for a document to build AI prompts).

## Related
- [[chunk.repository]]
- [[processing.service]]
- [[pinecone.service]]
- [[Model-Document]]
- [[Data-Flow#1. Upload flow]]

## Notes
Deleting a `Document` cascades to delete its `Chunk` rows in Postgres automatically, but does **not** automatically clean up the corresponding Pinecone vectors — [[document.service]]`.delete()` explicitly calls `pineconeService.deleteByDocumentId()` *before* the Prisma delete for that reason. If a future refactor removes that explicit call assuming cascade handles it, Pinecone vectors will leak.
