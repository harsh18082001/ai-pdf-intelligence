---
tags: [backend, controller]
---
## Purpose
HTTP handlers for document upload/list/recent/get/file-url/delete — thin layer that reads `req.owner` and delegates to [[document.service]].

## Key Details
- No more local `getClientId()` helper — every handler reads `req.owner` (`RequestOwner`, set once per request by [[guest-session.middleware]] + [[auth.middleware]] in `app.ts`) and throws `AppError('Unable to identify request', 401)` if somehow absent (shouldn't happen in practice — the guest middleware always sets it).
- `uploadDocument(req, res: Response<ApiResponse<DocumentDTO>>)`: throws 400 if `!req.files?.file`; `documentService.upload(file, req.owner)`; `201`. (The stray `console.log('UPLOADED FILE:', file)` debug line from before the auth overhaul is gone.)
- `listDocuments`: `documentService.list(req.owner)`, no-store cache headers, `200`.
- `listRecentDocuments` (**new**): `GET /api/documents/recent` — `documentService.listRecent(req.owner, 5)`. Must be registered **before** `GET /:id` in [[document.routes]] or Express would match `/recent` as `:id="recent"`.
- `getDocument`: parses `req.params.id`, `documentService.getById(id, req.owner)` — this call also marks the document as recently-accessed server-side (see [[document.service]]).
- `getDocumentFileUrl` (**new**): `GET /api/documents/:id/file` — `documentService.getFileUrl(id, req.owner)`, returns `{ url }`, a short-lived Backblaze B2 presigned URL. 404s if the document has no `storageKey` (e.g. B2 wasn't configured at upload time) or isn't owned by the caller; 503 if B2 isn't configured at all.
- `deleteDocument`: `documentService.delete(id, req.owner)`, `204`.

## Source
`server/src/controllers/document.controller.ts`

## Dependencies
- Imports: [[document.service]], `AppError` from [[error-handler]], `ApiResponse`/`DocumentDTO` types.
- Called by: [[document.routes]] (all handlers, each wrapped in `asyncHandler`).

## Related
- [[document.routes]]
- [[document.service]]
- [[documentApi]]
- [[guest-session.middleware]]
- [[auth.middleware]]
- [[API-Contract]]

## Notes
The `Cache-Control: no-store` headers on GET routes exist specifically so the frontend never sees a stale document `status` from an intermediary cache — don't remove these. Every handler here is now ownership-checked by construction — `documentService`'s methods all take `req.owner` and call `documentRepository.findOwnedById`, so there's no code path here that can leak another owner's document (contrast with the pre-auth-overhaul version documented in [[Known-Issues-and-Conventions]]).
