---
tags: [frontend, page]
---
## Purpose
Landing page: hero banner + upload CTA + the user's document grid.

## Key Details
- `export function HomePage()` — no props, no params.
- Renders (in order): left-aligned serif (`font-serif`) hero heading/subtext + [[UploadModal]] CTA, a stats row (total/ready/processing counts), a "Documents" heading, [[DocumentToolbar]] (search/status-filter/sort), then [[DocumentList]].
- **Filter state lives in the URL, not local `useState`** — `search`/`statusFilter`/`sortBy` are read from `useSearchParams()` (`?q=`, `?status=`, `?sort=`, all optional with sensible defaults) via a small `updateParam(key, value, defaultValue)` helper that deletes the param entirely when it's back to its default (keeps the URL clean, e.g. `/` rather than `/?status=all&sort=newest`). This is what lets [[AppSidebar]]'s status nav links (`/?status=completed` etc.) actually drive this page's filters — they're real navigation, not a synced-but-separate piece of state.
- Stats row (`total`, `ready`, `processing`) is computed via `useMemo` over the same `useGetDocumentsQuery()` result [[DocumentList]] and [[AppSidebar]] also subscribe to — RTK Query dedupes this to one shared network request/cache entry, not three. Rendered as colored icon chips (`STAT_CHIPS`: primary/`FileText` for total, success/`CheckCircle2` for ready, info/`Loader2` for processing) rather than plain text — the `processing` chip only renders when `stats.processing > 0`.
- The old decorative blurred-blob gradient hero and the primary→`blue-600` gradient CTA were removed as generic-template patterns — see [[Frontend-Architecture#Design system — "Glacier" (`index.css`)]]. The page no longer applies its own `animate-fade-in-up` entrance class — [[PageTransition]] now owns route-level enter/exit animation.
- Routed at `/` (index route) via [[App-tsx|App.tsx]].

## Source
`client/src/pages/HomePage.tsx`

## Dependencies
- Imports: [[DocumentList]], [[DocumentToolbar]] (`@/components/documents/DocumentToolbar`, also exports the `StatusFilter`/`SortOption` types), [[UploadModal]], [[documentApi]] (`useGetDocumentsQuery`, for the stats row).
- Rendered by: `App.tsx` as the index route inside [[Layout]].

## Related
- [[DocumentList]]
- [[DocumentToolbar]]
- [[UploadModal]]
- [[AppSidebar]]
- [[PageTransition]]
- [[Frontend-Architecture]]

## Notes
No longer purely presentational — it owns the URL-synced search/filter/sort state that `DocumentList` filters against client-side (there is no server-side query param for this; see [[DocumentList]]). If you need to change what shows on first load beyond filtering, edit `DocumentList`/`UploadModal`, not this file. If you add a new filter dimension, wire it the same way (a `useSearchParams` key + an `updateParam` call), not a fresh local `useState`, or [[AppSidebar]] won't be able to link to it.
