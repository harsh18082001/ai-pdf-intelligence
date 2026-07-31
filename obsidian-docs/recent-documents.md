---
tags: [frontend, lib]
---
## Purpose
Plain localStorage read/write functions backing the "recently viewed documents" sidebar list — capped at 5, most-recent first.

## Key Details
- `getRecentDocuments(): RecentDocument[]` — reads and JSON-parses `localStorage['dociq-recent-documents']`, defensively returning `[]` on any parse error or missing key.
- `pushRecentDocument(id, title): RecentDocument[]` — removes any existing entry for `id` (dedupe), prepends a new `{ id, title, visitedAt: Date.now() }`, slices to the 5 most recent, writes back to localStorage, and returns the new list.
- No React dependency — pure functions, wrapped by [[useRecentDocuments]] for component use.

## Source
`client/src/lib/recent-documents.ts`

## Dependencies
- No imports.
- Used by: [[useRecentDocuments]] (the only consumer — don't call these directly from a component, go through the hook so `storage`-event resync and React state updates stay correct).

## Related
- [[useRecentDocuments]]
- [[AppSidebar]]
- [[DocumentPage]]

## Notes
`MAX_RECENT` (5) and the storage key (`dociq-recent-documents`) are both module-level constants here — change them here, not in the hook, if that ever needs adjusting.
