---
tags: [backend, service]
---
## Purpose
Wraps the Pinecone client: upsert chunk embeddings, similarity search, and delete-by-document, all with optional per-client namespace isolation.

## Key Details
- `class PineconeService`, singleton export `pineconeService`. Constructed with `new Pinecone({ apiKey: env.PINECONE_API_KEY })`, targets a hardcoded index name `'dociq'` (`this.pinecone.index('dociq')`) — not configurable via env (only `PINECONE_INDEX_HOST` is, and that's used by the Pinecone SDK internally, not referenced by name in this file).
- `upsertChunks(documentId, chunks: Array<{ chunkIndex, text, embedding }>, ownerId?): Promise<void>`:
  - Record `id: `doc_${documentId}_chunk_${chunk.chunkIndex}``, `values: embedding`, `metadata: { documentId, chunkIndex, text }`.
  - `ns = ownerId ? this.index.namespace(ownerId) : this.index` — **`ownerId` here is the `clientId`**, used as the Pinecone namespace for tenant isolation.
  - Upserts in batches of 100 (`ns.upsert({ records: batch })`).
- `querySimilar(documentId, queryVector, topK = 5, ownerId?): Promise<Array<{ text, score }>>`:
  - Queries the same `ownerId`-scoped namespace, `filter: { documentId: { $eq: documentId } }`, `includeMetadata: true`.
  - Maps matches to `{ text: metadata.text, score: match.score }` — the raw embedding values are never returned to callers.
- `deleteByDocumentId(documentId, ownerId?): Promise<void>`:
  - Fetches the index's actual dimension via `describeIndexStats()` (falls back to `768` if unavailable) to build a correctly-sized dummy zero-vector.
  - Queries with that dummy vector, `topK: 10000`, filtered to `documentId`, to enumerate matching record IDs (Pinecone has no native "delete by metadata filter" in this SDK path — this is a workaround).
  - `ns.deleteMany({ ids: idsToDelete })` if any found.
  - Wrapped in try/catch that only **warns** on failure (does not throw) — "They may need manual cleanup."

## Source
`server/src/services/pinecone.service.ts`

## Dependencies
- Imports: `@pinecone-database/pinecone`, `env`, `logger`.
- Called by: [[processing.service]] (`upsertChunks`), [[chat.service]] (`querySimilar` in `prepareChat`), [[document.service]] (`deleteByDocumentId`).

## Related
- [[processing.service]]
- [[chat.service]]
- [[document.service]]
- [[Model-Chunk]]
- [[Data-Flow#1. Upload flow]]
- [[Data-Flow#2. Chat message flow]]

## Notes
Tenant isolation for vector search is **namespace-based** (`ownerId`/`clientId`), separate from and in addition to the `documentId` metadata filter — both must line up for a query to find anything. If `clientId` is missing/undefined at upload time vs. present at query time (or vice versa), the vectors will silently live in a different namespace than the one being queried, and chat will fail with "No document content available for context" ([[chat.service]]) even though the document processed successfully. The `topK: 10000` dummy-vector delete workaround will silently miss documents with more than 10,000 chunks (extremely unlikely given ~512-token chunking, but not literally impossible for a huge PDF).
