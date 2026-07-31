---
tags: [backend, api]
---
## Purpose
Express router for `/api/documents` — upload, list, get, delete.

## Key Details
Mounted at `/documents` under the main router ([[routes-index|routes/index.ts]]), so full paths are `/api/documents...`.

| Method | Path | Middleware chain | Handler |
|---|---|---|---|
| POST | `/` | [[upload]] (`uploadPdf`) → `asyncHandler` | [[document.controller#uploadDocument]] |
| GET | `/` | `asyncHandler` | [[document.controller#listDocuments]] |
| GET | `/:id` | `asyncHandler` | [[document.controller#getDocument]] |
| DELETE | `/:id` | `asyncHandler` | [[document.controller#deleteDocument]] |

No `chatMessageSchema`/Zod body validation on these routes — a code comment explicitly notes ID params aren't validated by [[validation]]'s middleware (which only validates `req.body`); instead each controller does `parseInt` + `isNaN` checks and throws `AppError('Invalid document ID', 400)` manually.

## Source
`server/src/routes/document.routes.ts`

## Dependencies
- Imports: [[upload]] (`uploadPdf`), [[validation]] (`idParamSchema` — imported but **unused** in this file), `asyncHandler` from [[processor|utils/async-handler.ts]], all four handlers from [[document.controller]].
- Mounted by: [[routes-index|routes/index.ts]] at `/documents`.

## Related
- [[document.controller]]
- [[document.service]]
- [[API-Contract]]
- [[Data-Flow#1. Upload flow]]

## Notes
`idParamSchema` is imported but never applied — `:id`/`:documentId` validation is done ad hoc in every controller via `parseInt`/`isNaN` instead. If you add a new ID-based route, follow that same manual pattern (or wire up `idParamSchema` properly, but be consistent with existing routes).
