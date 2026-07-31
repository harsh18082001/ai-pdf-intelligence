---
tags: [backend, middleware]
---
## Purpose
Central error-handling middleware: a typed `AppError` class, a 404 handler, and the global error-to-JSON translator.

## Key Details
- `class AppError extends Error { statusCode: number; isOperational: boolean }` — constructor `(message, statusCode = 500, isOperational = true)`. Thrown throughout controllers/services for expected error conditions (invalid ID, not found, validation, etc.).
- `notFoundHandler(req, res, next)` — registered as Express middleware *after* all routes; calls `next(new AppError('Not Found - METHOD url', 404))` for any unmatched route.
- `errorHandler(err, req, res: Response<ApiResponse>, next)` — the final Express error-handling middleware (4-arg signature):
  - `AppError` → uses its `statusCode`/`message`.
  - `ZodError` → `400`, message `'Validation Error'`, `details: err.errors`.
  - `err.name === 'MulterError'` (thrown by `express-fileupload`'s size-limit enforcement) → `400`, `err.message`.
  - Anything else → `500`, generic `'Internal Server Error'`, and logs via `logger.error(err, 'Unhandled error')`.
  - Additionally logs full request context (`method`, `url`, `body`, `params`) whenever the error is **not** an operational `AppError`, or is a 5xx — i.e. expected 4xx `AppError`s are not verbosely logged, everything else is.
  - Always responds `{ success: false, error: message, details }` — matches the `ApiResponse` shape every endpoint uses.

## Source
`server/src/middlewares/error-handler.ts`

## Dependencies
- Imports: `zod` (`ZodError`), `logger`, `ApiResponse` type.
- `AppError` is imported and thrown by: [[document.controller]], [[chat.controller]], [[document.service]], [[chat.service]], [[command.service]], [[upload]].
- `notFoundHandler`/`errorHandler` are registered in `app.ts` as the last two middlewares (after `/api` routes).

## Related
- [[validation]]
- [[upload]]
- [[API-Contract]]

## Notes
Every route handler must either be wrapped in [[processor|utils/async-handler.ts]]'s `asyncHandler` or manually catch+`next(err)` — an unwrapped `async` route handler that throws will produce an unhandled rejection Express never routes to `errorHandler`. All current routes ([[document.routes]], [[chat.routes]], [[command.routes]]) do wrap with `asyncHandler`, **except** `streamMessage` in [[chat.controller]], which manually try/catches internally instead (since it needs to write SSE-formatted errors, not JSON, after headers are already sent).
