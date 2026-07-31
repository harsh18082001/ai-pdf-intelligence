---
tags: [frontend, component]
---
## Purpose
Fetches and renders the grid of the current user's documents, with loading/error/empty states.

## Key Details
- `DocumentList({ search, statusFilter, sortBy }: DocumentListProps)` — filter/sort criteria are now owned by [[HomePage]] and passed in as props; this component still owns the actual data fetch.
- Calls `useGetDocumentsQuery()` from [[documentApi]] → `{ data: documents = [], isLoading, error }`, then applies `search`/`statusFilter`/`sortBy` client-side via a `useMemo` (`documentApi` has no server-side filter params — see [[documentApi]]).
- Four states, each distinguished: loading → a skeleton grid ([[Frontend-Architecture]]'s `Skeleton` primitive, matching the real card grid shape); fetch error → [[EmptyState]] ("Failed to load documents"); zero documents at all → [[EmptyState]] with [[UploadModal]] as the CTA ("No documents yet"); zero documents *after* filtering (documents exist, none match) → a distinct [[EmptyState]] ("No matching documents") with no upload CTA.
- Otherwise renders a responsive grid (`1→2→3→4` columns) of [[DocumentCard]], keyed by `doc.id`, wrapped in `framer-motion` `variants` for a staggered fade/slide-up entrance (`staggerChildren: 0.05`) — only animates in newly-mounted cards, not ones that survive a re-filter.

## Source
`client/src/components/documents/DocumentList.tsx`

## Dependencies
- Imports: [[documentApi]] (`useGetDocumentsQuery`), [[DocumentCard]], [[UploadModal]], [[EmptyState]], the `Skeleton` ui primitive, and the `StatusFilter`/`SortOption` types from [[DocumentToolbar]].
- Used by: [[HomePage]], which also renders [[DocumentToolbar]] above it and owns the filter state.

## Related
- [[HomePage]]
- [[DocumentCard]]
- [[DocumentToolbar]]
- [[EmptyState]]
- [[documentApi]]

## Notes
Empty-list and "no documents match this client" (missing/failed `x-client-id`) still look identical (both hit the "No documents yet" branch) — see [[Known-Issues-and-Conventions]] on the `x-client-id` mechanism. That is now a *third*, visually distinct case from "no documents match the current search/filter", which has its own copy and no upload CTA.
