---
tags: [backend, middleware]
---
## Purpose
Pre-controller validation for the document upload route: ensures exactly one PDF file was attached.

## Key Details
- `uploadPdf(req, _res, next)`:
  1. `files = (req as any).files` (populated by the global `express-fileupload` middleware in `app.ts`, not by this file itself) — if `!files || !files.file`, `next(new AppError('No file uploaded', 400))`.
  2. If `Array.isArray(file)` (i.e. multiple files sent under the same `file` field name) — `next(new AppError('Only one file is allowed', 400))`.
  3. If `!SUPPORTED_MIME_TYPES.includes(file.mimetype)` (only `'application/pdf'` is supported) — `next(new AppError('Only PDF files are allowed', 400))`.
  4. Otherwise `next()`.
- This middleware only validates presence/type — actual file **size** limiting (`MAX_FILE_SIZE_MB`) is enforced by `express-fileupload`'s own `limits.fileSize` + `abortOnLimit: true` config in `app.ts`, which throws a `MulterError`-named error caught by [[error-handler]], not by this file.

## Source
`server/src/middlewares/upload.ts`

## Dependencies
- Imports: `AppError` from [[error-handler]], `SUPPORTED_MIME_TYPES` constant.
- Used by: [[document.routes]] (`router.post('/', uploadPdf, asyncHandler(uploadDocument))`).

## Related
- [[document.routes]]
- [[document.controller]]
- [[error-handler]]

## Notes
`express-fileupload` is configured in `app.ts` with `useTempFiles: false`, so the entire uploaded file lives in memory as `file.data` (a `Buffer`) — there is no disk-based temp file to clean up, but large concurrent uploads are bounded only by process memory and the 50MB-per-file cap, not by total concurrent upload size.
