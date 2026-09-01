---
tags: [frontend, hook]
---
## Purpose
React hook that reads the server-tracked "recently viewed" list — used to render the sidebar's "Recent" section. **No longer localStorage-backed.**

## Key Details
- `useRecentDocuments(): { recent: DocumentDTO[] }` — a thin wrapper around `useGetRecentDocumentsQuery()` ([[documentApi]]). That's the whole file now (down from a `getRecentDocuments`/`pushRecentDocument`/`storage`-event setup).
- There's no `recordVisit` anymore — recording a visit happens automatically server-side, inside [[document.service]]`.getById` (`documentRepository.touchAccessed(id)`) whenever `GET /api/documents/:id` is called, i.e. whenever [[DocumentPage]] fetches the document. The old client-side "record a visit in a `useEffect`" call was removed from [[DocumentPage]] entirely.
- Because it's an RTK Query hook, "Recent" now shares the same `['Document']` cache-invalidation as every other document query — no separate sync mechanism needed, and it updates across devices/browsers for a logged-in user (or the same guest session) instead of being stuck to one browser's localStorage.

## Source
`client/src/hooks/useRecentDocuments.ts`

## Dependencies
- Imports: [[documentApi]] (`useGetRecentDocumentsQuery`).
- Used by: [[AppSidebar]] (reads `recent` to render the list).

## Related
- [[documentApi]]
- [[document.service]]
- [[AppSidebar]]
- [[DocumentPage]]
- [[Known-Issues-and-Conventions#Auth is now real: email/password + server-issued guest sessions]]

## Notes
The deleted `client/src/lib/recent-documents.ts` module (localStorage key `dociq-recent-documents`, max 5 items, `{id, title, visitedAt}` shape) no longer exists — if you see a reference to it anywhere, it's stale. The server-side equivalent is `Document.lastAccessedAt` + [[document.repository]]`.findRecent(owner, limit)`, capped at 5 the same way, just owner-scoped instead of per-browser.
