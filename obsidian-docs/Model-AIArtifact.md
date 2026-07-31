---
tags: [backend, model]
---
## Purpose
Prisma model caching one generated AI artifact (summary / key_points / insights / ...) per document, so repeated requests skip re-calling Gemini.

## Key Details
```prisma
model AIArtifact {
  id         Int      @id @default(autoincrement())
  documentId Int
  type       String   // summary, key_points, insights, etc.
  content    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([documentId, type])
  @@map("ai_artifacts")
}
```
- Table: `ai_artifacts`. **Unique constraint on `(documentId, type)`** — at most one artifact of each type per document; this is what makes [[ai-artifact.repository]]`.upsert()` an actual upsert (find-then-create-or-update).
- `type` is free-form `String`; allowed values enforced at the request-validation layer via `ARTIFACT_TYPES` in `config/constants.ts`: `summary | key_points | insights | flashcards | quiz | interview_questions | resume_analysis`. Only `summary`/`key_points`/`insights` have actual prompt-builder implementations in [[templates|ai/prompts/templates.ts]] and UI buttons in [[DocumentHeader]]'s Actions dropdown — the rest are schema-valid but functionally a no-op fallback (see [[command.service]] Notes).

## Source
`server/prisma/schema.prisma` (AIArtifact model)

## Dependencies
- Read/written by: [[ai-artifact.repository]] (`findByDocumentAndType`, `upsert`, `deleteByDocumentId`, `deleteByDocumentAndType`).
- Written/read during: [[command.service]]`.execute()` — cache check (`!regenerate` → `findByDocumentAndType`) then cache write (`upsert`).

## Related
- [[ai-artifact.repository]]
- [[command.service]]
- [[Model-Document]]
- [[Data-Flow#5. Command flow]]

## Notes
`command.service.ts`'s switch statement only has cases for `summary`/`key_points`/`insights`; any other `ARTIFACT_TYPES` value (e.g. `flashcards`) falls through to the `default` case which silently **reuses the summary prompt** rather than erroring — so calling the command API with `command: "flashcards"` will validate successfully and cache a summary under the `flashcards` type. If you implement a real flashcards feature, add its case to the switch in [[command.service]] and a corresponding prompt builder in [[templates]] before relying on this artifact type.
