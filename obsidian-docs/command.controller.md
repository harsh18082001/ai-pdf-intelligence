---
tags: [backend, controller]
---
## Purpose
HTTP handler for one-click AI commands. Thinnest controller in the app — one function, no clientId handling at all.

## Key Details
- `executeCommand(req, res: Response<ApiResponse<AIArtifactDTO>>)`: destructures `{ documentId, command, regenerate }` straight from `req.body` (already Zod-validated by `commandSchema` in [[chat.routes|command.routes]]), calls `commandService.execute(documentId, command, regenerate)`, responds `200` with `{ success: true, data: result }`.

## Source
`server/src/controllers/command.controller.ts`

## Dependencies
- Imports: [[command.service]], `ApiResponse`/`AIArtifactDTO` types.
- Called by: [[command.routes]].

## Related
- [[command.routes]]
- [[command.service]]
- [[commandApi]]
- [[Known-Issues-and-Conventions#Command execution is not tenant-scoped]]

## Notes
**No `clientId` is read or forwarded here at all** — unlike every other controller in the app. [[command.service]]`.execute()` never checks document ownership, only that the document exists and is `completed`. Any caller who knows a valid `documentId` can trigger (and read the cached result of) summary/key_points/insights generation for that document regardless of who uploaded it. See [[Known-Issues-and-Conventions]] before "fixing" — this may be intentional for an MVP with no real per-user security boundary, but it's inconsistent with [[document.controller]]/[[chat.controller]]'s partial `clientId` scoping.
