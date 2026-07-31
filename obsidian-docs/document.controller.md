---
tags: [backend, controller]
---
## Purpose
HTTP handlers for document upload/list/get/delete — thin layer that extracts `clientId`/params and delegates to [[document.service]].

## Key Details
- `getClientId(req): string | undefined` (private helper, duplicated verbatim in [[chat.controller]]) — checks `req.headers['x-client-id']` → `req.query.clientId` → `req.body?.clientId`, in that order, returns the first non-empty trimmed string.
- `uploadDocument(req, res: Response<ApiResponse<DocumentDTO>>)`:
  - Throws `AppError('No file uploaded', 400)` if `!req.files?.file`.
  - `file = req.files.file as UploadedFile` (express-fileupload type); calls `documentService.upload(file, clientId)`.
  - Responds `201` with `{ success: true, data: document }`. Contains a stray `console.log('UPLOADED FILE:', file)` debug line.
- `listDocuments(req, res: Response<ApiResponse<DocumentDTO[]>>)`: `documentService.list(clientId)`, sets `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`, responds `200`.
- `getDocument(req, res)`: parses `req.params.id`, throws 400 if `isNaN`, calls `documentService.getById(id, clientId)`, same no-store cache headers, `200`.
- `deleteDocument(req, res)`: parses `id`, calls `documentService.delete(id, clientId)`, responds `204` with no body.

## Source
`server/src/controllers/document.controller.ts`

## Dependencies
- Imports: [[document.service]], `AppError` from [[error-handler]], `ApiResponse`/`DocumentDTO` types.
- Called by: [[document.routes]] (all four handlers, each wrapped in `asyncHandler`).

## Related
- [[document.routes]]
- [[document.service]]
- [[documentApi]]
- [[API-Contract]]

## Notes
The `Cache-Control: no-store` headers on GET routes exist specifically so the frontend never sees a stale document `status` (e.g. still "processing" after it actually completed) from an intermediary cache — don't remove these without understanding that's their purpose. The `console.log('UPLOADED FILE:', file)` is leftover debug output and logs the full `UploadedFile` object (including its binary `data` buffer) to stdout on every upload.
