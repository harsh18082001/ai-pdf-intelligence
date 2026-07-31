---
tags: [backend, service]
---
## Purpose
Executes one-click AI commands with a Postgres-backed cache: checks for an existing artifact, else builds a prompt from all chunks and calls Gemini, then upserts the result.

## Key Details
- `class CommandService`, singleton export `commandService`.
- `execute(documentId, command, regenerate = false): Promise<AIArtifactDTO>`:
  1. `if (!ARTIFACT_TYPES.includes(command)) throw AppError(400)` (belt-and-suspenders — `commandSchema` in [[validation]] already enforces this at the route layer).
  2. Fetch document by ID **with no `clientId` argument at all** — see Notes.
  3. Throw 400 unless `doc.status === DOCUMENT_STATUS.COMPLETED`.
  4. If `!regenerate`: check `aiArtifactRepository.findByDocumentAndType(documentId, command)` — if found, return it immediately as the DTO (cache hit, zero LLM calls).
  5. Cache miss (or `regenerate: true`): `chunkRepository.findByDocumentId(documentId)` → throw 400 if empty → build prompt via a `switch (command)`:
     - `'summary'` → `buildSummaryPrompt`
     - `'key_points'` → `buildKeyPointsPrompt`
     - `'insights'` → `buildInsightsPrompt`
     - `default` (i.e. `flashcards`, `quiz`, `interview_questions`, `resume_analysis`) → **falls back to `buildSummaryPrompt`** (no dedicated implementation).
  6. `aiService.chatCompletion({ messages })` → `aiArtifactRepository.upsert(documentId, command, content)` → returns the DTO.

## Source
`server/src/services/command.service.ts`

## Dependencies
- Imports: [[document.repository]], [[chunk.repository]], [[ai-artifact.repository]], [[ai.service]], `buildSummaryPrompt`/`buildKeyPointsPrompt`/`buildInsightsPrompt` from [[templates]], `AppError`, constants (`ARTIFACT_TYPES`, `DOCUMENT_STATUS`).
- Called by: [[command.controller]]`.executeCommand` (which itself receives no `clientId`).

## Related
- [[command.controller]]
- [[templates]]
- [[Model-AIArtifact]]
- [[Data-Flow#5. Command flow]]
- [[Known-Issues-and-Conventions#Command execution is not tenant-scoped]]

## Notes
Neither this service nor its controller ever receive or check `clientId` — **any caller who knows a valid, completed `documentId` can trigger and read cached AI artifacts for it**, regardless of which client uploaded it. This is the least tenant-scoped code path in the backend (contrast with [[document.service]] and [[chat.service]]`.sendMessage`, which do check ownership). If asked to add multi-tenant security here, thread a `clientId` through `command.controller.executeCommand` → `commandService.execute` → a `documentRepository.findById` ownership check, matching the pattern already used in [[document.service]]. Also: the `default` switch case means requesting `command: "flashcards"` silently generates and caches a *summary* under type `flashcards` — not an error, but not what the artifact type name promises either.
