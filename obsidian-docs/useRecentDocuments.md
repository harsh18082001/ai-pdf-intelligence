---
tags: [frontend, hook]
---
## Purpose
React hook wrapper around the localStorage-backed [[recent-documents]] list — used to render and update the sidebar's "Recent" section.

## Key Details
- `useRecentDocuments(): { recent: RecentDocument[], recordVisit: (id: number, title: string) => void }`.
- `recent` initializes from `getRecentDocuments()` and re-syncs on the browser `storage` event (fires when localStorage changes in *another* tab/window — cross-tab consistency).
- `recordVisit` calls `pushRecentDocument(id, title)` and updates local state with the result directly (same-tab updates don't rely on the `storage` event, which only fires for other tabs/windows, never the one that made the change).

## Source
`client/src/hooks/useRecentDocuments.ts`

## Dependencies
- Imports: [[recent-documents]] (`getRecentDocuments`, `pushRecentDocument`, `RecentDocument` type).
- Used by: [[AppSidebar]] (reads `recent` to render the list), [[DocumentPage]] (calls `recordVisit` on document load).

## Related
- [[recent-documents]]
- [[AppSidebar]]
- [[DocumentPage]]

## Notes
Purely client-side/local-device — there is no server-side "recently viewed" concept, and this list does not sync across devices or browsers (consistent with how [[pdfStorage]]'s PDF cache also stays per-device).
