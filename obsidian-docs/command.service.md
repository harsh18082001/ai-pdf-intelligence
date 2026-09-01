---
tags: [backend, service]
---
## Purpose
Executes one-click AI commands with a Postgres-backed cache: checks for an existing artifact, else builds a prompt from all chunks and calls Gemini, then upserts the result.

## Key Details
- `class CommandService`, singleton export `commandService`.
- `execute(documentId, command, owner: RequestOwner, regenerate = false): Promise<AIArtifactDTO>`:
  1. `if (!ARTIFACT_TYPES.includes(command)) throw AppError(400)` (belt-and-suspenders alongside [[validation]]'s `commandSchema`).
  2. `documentRepository.findOwnedById(documentId, owner)` — **now ownership-checked** (previously a bare `findById` with no owner argument at all — see [[Known-Issues-and-Conventions]]).
  3. Throw 400 unless `doc.status === DOCUMENT_STATUS.COMPLETED`.
  4. Cache check/miss/build/save logic is unchanged — see the `switch (command)` prompt-builder dispatch and the `default` fallback-to-summary behavior.

## Source
`server/src/services/command.service.ts`

## Dependencies
- Imports: [[document.repository]], [[chunk.repository]], [[ai-artifact.repository]], [[ai.service]], prompt builders from [[templates]], `AppError`, constants, `RequestOwner` type.
- Called by: [[command.controller]]`.executeCommand`, which now passes `req.owner`.

## Related
- [[command.controller]]
- [[templates]]
- [[Model-AIArtifact]]
- [[Data-Flow#5. Command flow]]
- [[Known-Issues-and-Conventions#Chat history and commands are now tenant-scoped too (previously a known gap — closed)]]

## Notes
This used to be the least tenant-scoped path in the backend — any caller who knew a `documentId` could trigger/read cached artifacts for it. That's closed now via `findOwnedById`. The `default` switch-case behavior is unchanged and still worth knowing: requesting `command: "flashcards"` (or `quiz`/`interview_questions`/`resume_analysis`) silently generates and caches a *summary* under that artifact type's name, not an error.
