---
tags: [backend, api]
---
## Purpose
Express router for one-click AI commands (summary / key_points / insights / ...).

## Key Details
Mounted at `/commands` under the main router. Single route:

| Method | Path | Middleware | Handler |
|---|---|---|---|
| POST | `/` (→ `/api/commands`) | `aiLimiter` → `validate(commandSchema)` | [[command.controller#executeCommand]] |

`commandSchema` (from [[validation]]) validates the body: `{ documentId: number (int, positive), command: string (must be in ARTIFACT_TYPES), regenerate?: boolean }`.

## Source
`server/src/routes/command.routes.ts`

## Dependencies
- Imports: `asyncHandler`, [[validation]] (`validate`, `commandSchema`), [[rate-limiter]] (`aiLimiter`), [[command.controller]] (`executeCommand`).
- Mounted by: [[routes-index|routes/index.ts]] at `/commands`.

## Related
- [[command.controller]]
- [[command.service]]
- [[commandApi]]
- [[API-Contract]]
- [[Data-Flow#5. Command flow]]

## Notes
Unlike [[document.routes]] and [[chat.routes]], `documentId` here comes from the JSON body (not a URL param), since the route itself has no `:id` segment — `POST /api/commands` with `documentId` inside the payload.
