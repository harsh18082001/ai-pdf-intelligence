---
tags: [backend, repository]
---
## Purpose
Direct Prisma access for the `AIArtifact` table, including the find-or-upsert logic backing the AI response cache.

## Key Details
- `class AIArtifactRepository`, singleton export `aiArtifactRepository`.
- `findByDocumentAndType(documentId, type): Promise<AIArtifact | null>`.
- `upsert(documentId, type, content): Promise<AIArtifact>` — calls `findByDocumentAndType` itself; if found, `update`s its `content`; else `create`s a new row. (Not a native Prisma `upsert()` call despite the name — it's implemented as manual find-then-write, which is fine given the `@@unique([documentId, type])` constraint but means it's not atomic under concurrent requests for the same `(documentId, type)`.)
- `deleteByDocumentId(documentId): Promise<number>`.
- `deleteByDocumentAndType(documentId, type): Promise<number>`.

## Source
`server/src/repositories/ai-artifact.repository.ts`

## Dependencies
- Imports: `prisma` from `db.ts`.
- Used by: [[command.service]] (`findByDocumentAndType` for cache check, `upsert` to save a freshly-generated artifact).

## Related
- [[Model-AIArtifact]]
- [[command.service]]

## Notes
Two near-simultaneous requests for the same uncached `(documentId, type)` could both miss the cache, both call Gemini, and both `upsert` — the unique constraint means the second write updates rather than conflicts, so no error occurs, but it does mean a duplicate (wasted) LLM call is possible under race conditions. Not currently guarded against (no locking/debouncing).
