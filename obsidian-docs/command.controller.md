---
tags: [backend, controller]
---
## Purpose
HTTP handler for one-click AI commands. Still the thinnest controller in the app — one function.

## Key Details
- `executeCommand(req, res: Response<ApiResponse<AIArtifactDTO>>)`: destructures `{ documentId, command, regenerate }` from `req.body` (Zod-validated by `commandSchema`), throws `AppError(401)` if `!req.owner` (shouldn't happen), calls `commandService.execute(documentId, command, req.owner, regenerate)`, responds `200`.

## Source
`server/src/controllers/command.controller.ts`

## Dependencies
- Imports: [[command.service]], `AppError`, `ApiResponse`/`AIArtifactDTO` types.
- Called by: [[command.routes]].

## Related
- [[command.routes]]
- [[command.service]]
- [[commandApi]]
- [[Known-Issues-and-Conventions#Chat history and commands are now tenant-scoped too (previously a known gap — closed)]]

## Notes
This used to be the one controller in the app that never read or forwarded any identity at all — [[command.service]]`.execute()` now does an ownership check via `req.owner`, closing the gap previously documented here (and in [[Known-Issues-and-Conventions]]) where any caller who knew a `documentId` could trigger/read another owner's cached AI artifacts.
