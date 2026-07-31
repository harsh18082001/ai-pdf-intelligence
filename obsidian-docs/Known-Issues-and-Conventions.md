---
tags: [conventions]
---
## Purpose
Tacit context a fresh agent would otherwise have to rediscover the hard way — recent history, deliberate removals, and known gaps. Framed as "if you touch X, don't reintroduce Y."

## Key Details

### Document queries must stay scoped per client
Commit `47d92bf` fixed a cross-user document leakage bug by scoping the document *list* query to the caller's `clientId` and removing a global Supabase Realtime broadcast listener. Current state:
- [[document.repository]]`.findAll(clientId)` returns `[]` outright if `clientId` is falsy — it never lists documents when identity is unknown.
- [[document.repository]]`.findById(id)` still has **no** clientId filter by design — [[document.service]]`.getById`/`.delete`/`.getProcessingStatus` each do the ownership check themselves (`doc.clientId !== clientId` → 404) *after* fetching.
- If you add a new "fetch by ID" code path, you must repeat that same ownership check in the service layer — the repository will not do it for you.
- Don't reintroduce a global realtime/broadcast subscription (e.g. Supabase Realtime, a WebSocket fanout) that pushes document updates to all connected clients — that was the shape of the original leak.

### Two endpoints are NOT tenant-scoped (known gap, not yet fixed)
- [[chat.service]]`.getHistory(documentId)` — no `clientId` parameter, no ownership check. Any caller who knows a `documentId` can read its full chat history via `GET /api/documents/:documentId/chat`.
- [[command.service]]`.execute(...)` / [[command.controller]] — `clientId` is never read anywhere in this path. Any caller who knows a `documentId` can trigger/read cached AI artifacts (`POST /api/commands`) for it.
- Contrast with [[document.service]] and [[chat.service]]`.sendMessage`/`.streamMessage` (via `prepareChat`), which **do** check `doc.clientId !== clientId`.
- If asked to close this gap, follow the existing pattern: thread `clientId` through controller → service → the same `if (!doc || (clientId && doc.clientId !== clientId)) throw AppError(404)` check used in [[document.service]].

### Auth is a localStorage clientId, not Supabase session (commit `2d1da58`)
- Commit `2d1da58` replaced a polling-based approach with reading the session/identity from localStorage, to fix repeated GET requests. The **current** identity mechanism is a random `clientId` UUID (`AuthContext.getStoredClientId()`), not a real Supabase Auth session — see [[AuthContext]].
- `@supabase/supabase-js` is installed and `lib/supabase.ts` creates a client, but **nothing imports it** — same for `lib/user.ts`'s `getOrCreateUserId()`. Both are dead code. Don't assume either is part of the active auth path.
- Don't reintroduce a polling `useEffect`/`setInterval` to keep client identity or document status in sync — the fix specifically moved away from polling. If document status needs to update live, prefer the existing `Cache-Control: no-store` + refetch-on-mutation pattern already used ([[documentApi]]'s tag invalidation), not a new poll loop.
- No global Supabase Realtime broadcast listener exists (deliberately removed per `47d92bf`) — don't add one back for "live updates" without re-solving the leakage this caused originally.

### Upload is synchronous end-to-end, not a background job
[[document.service]]`.upload()` `await`s the entire pipeline ([[processor]] → [[processing.service]]) before the HTTP response returns. This is intentional for Vercel serverless compatibility (background work would be killed once the response is sent). There is no queue, no job table, no polling endpoint wired up client-side (though [[document.service]]`.getProcessingStatus()` exists server-side, unused). Don't assume "add a progress bar" is a small change — it requires either a real background-job mechanism or a different serverless-compatible pattern (e.g. `waitUntil` + a status-polling endpoint).

### PDF preview is device-local, not server-backed
The raw PDF binary is never stored or served by the backend — only extracted text/chunks/embeddings are. The browser's IndexedDB ([[pdfStorage]]) is the only place the actual file bytes live, written at upload time and re-attachable manually per-device via [[PDFViewer]]'s "Attach PDF" flow. Don't build a feature assuming `GET /api/documents/:id/file` (or similar) exists — it doesn't (see [[API-Contract]]).

### README is aspirational, not authoritative
`README.md` documents endpoint paths (`/api/documents/upload`, `/api/chat/:documentId`, `/api/commands/:documentId`) and a client env var (`VITE_API_BASE_URL`) that **do not match** the actual implemented routes/vars. Always trust the source (`server/src/routes/*`, `client/src/api/*`, `client/src/lib/supabase.ts` usage) over the README when in doubt — see [[API-Contract]] and [[ENV-Variables]] for the corrected, code-verified versions.

### Artifact types beyond the MVP three are schema-valid but not implemented
`ARTIFACT_TYPES` (`config/constants.ts`) lists `flashcards`, `quiz`, `interview_questions`, `resume_analysis` alongside `summary`/`key_points`/`insights`. Only the latter three have real prompt builders in [[templates]] and buttons in [[MetadataPanel]]. Requesting one of the other four via the API validates successfully but [[command.service]]'s `switch` falls through to `default` and silently generates (and caches) a **summary** under that artifact type's name. If implementing one of these, add both a prompt builder (in [[templates]]) and a `case` in [[command.service]]'s switch — the schema/validation/DB layers already support it.

### Duplicated logic to be aware of, not "fix" reflexively
- `getClientId(req)` is copy-pasted identically in [[document.controller]] and [[chat.controller]] (no shared helper module). Consistent behavior today, but a future edit to one must be mirrored in the other, or extract a shared helper deliberately.
- Status-badge-config logic (`getStatusConfig`) is duplicated between [[DocumentCard]] and [[MetadataPanel]] on the client.

## Source
Derived from git history (`47d92bf`, `2d1da58`) plus direct code reading across `client/src` and `server/src`.

## Dependencies
N/A — this is a cross-cutting index of gotchas.

## Related
- [[document.service]]
- [[document.repository]]
- [[chat.service]]
- [[command.service]]
- [[AuthContext]]
- [[lib-supabase]]
- [[lib-user]]
- [[processor]]
- [[pdfStorage]]
- [[API-Contract]]
- [[ENV-Variables]]

## Notes
This file should be updated whenever a future change closes one of the gaps above (tenant-scoping chat history/commands, adding real auth, adding a job queue) — remove the stale caveat rather than leaving it to rot once fixed.
