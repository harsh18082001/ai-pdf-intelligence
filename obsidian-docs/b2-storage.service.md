---
tags: [backend, service]
---
## Purpose
Original-PDF storage on Backblaze B2, via its S3-compatible API. Optional — degrades to a no-op if unconfigured.

## Key Details
- `class B2StorageService`, singleton export `b2StorageService`. Constructor builds an `S3Client` (`@aws-sdk/client-s3`) only if `B2_KEY_ID`/`B2_APPLICATION_KEY`/`B2_ENDPOINT` are all set; otherwise `s3Client` stays `null` and every method becomes a safe no-op (`isEnabled` getter reflects this).
- `uploadPdf(fileBuffer, originalFileName): Promise<string | null>` — `storageKey = `documents/${uuid()}_${originalFileName}`` (uuid prefix avoids collisions on repeated filenames), `PutObjectCommand`. Returns `null` (not a throw) on any failure or if disabled — callers treat "no storage key" as "this document just doesn't have a stored original," not an error.
- `getPresignedUrl(storageKey, expiresInSeconds = 300)` — `GetObjectCommand` + `getSignedUrl` from `@aws-sdk/s3-request-presigner`. Short expiry by design — these URLs are generated fresh per request (`GET /api/documents/:id/file`), never cached/stored.
- `deletePdf(storageKey)` — `DeleteObjectCommand`, best-effort (logs on failure, doesn't throw) — called from [[document.service]]`.delete()` alongside the Pinecone cleanup.

## Source
`server/src/services/b2-storage.service.ts`

## Dependencies
- Imports: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `env`, `logger`, `uuid`.
- Called by: [[document.service]] (`upload`, `getFileUrl`, `delete`).

## Related
- [[document.service]]
- [[document.controller]]
- [[Model-Document]]
- [[ENV-Variables]]
- [[Known-Issues-and-Conventions#PDF preview: IndexedDB is still the primary path; B2 is a fallback, not a replacement]]

## Notes
This is a hardened reintroduction of `b2-storage.service.ts` from a prior (reverted) commit (`7a66ac6`) — same S3-compatible approach, same bucket-name/region env shape. Nothing on the frontend calls `getPresignedUrl`'s endpoint yet (see the Known-Issues link above) — don't assume "download original PDF" is a wired-up user-facing feature just because the backend supports it.
