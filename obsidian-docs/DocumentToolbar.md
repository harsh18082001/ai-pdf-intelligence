---
tags: [frontend, component]
---
## Purpose
Search + status-filter + sort controls sitting above the document grid on [[HomePage]].

## Key Details
- `DocumentToolbar({ search, onSearchChange, statusFilter, onStatusFilterChange, sortBy, onSortByChange }: DocumentToolbarProps)` — fully controlled, no local state; [[HomePage]] owns the actual values (as of the app-shell redesign, backed by `useSearchParams` rather than `useState` — see [[HomePage]] — but that's invisible to this component, which only ever sees plain string props/callbacks).
- Also exports the `StatusFilter` (`'all' | 'completed' | 'processing' | 'failed' | 'ocr_required' | 'pending'`) and `SortOption` (`'newest' | 'oldest' | 'name'`) types — [[DocumentList]] imports these for its own prop types rather than redeclaring them.
- Search is a shadcn `Input` with a `Search` icon; status filter and sort are plain native `<select>`s (styled to match the `Input`/`Button` tokens) rather than a new Radix `Select` primitive, to keep the addition small.
- Purely a controls UI — it does not fetch or filter documents itself; [[DocumentList]] does the actual client-side filtering/sorting against the values this component reports up.

## Source
`client/src/components/documents/DocumentToolbar.tsx`

## Dependencies
- Imports: `lucide-react`'s `Search`, the `Input` ui primitive.
- Used by: [[HomePage]] (renders it above [[DocumentList]], sharing the same three pieces of state with both).

## Related
- [[HomePage]]
- [[DocumentList]]
- [[AppSidebar]]
- [[Frontend-Architecture]]

## Notes
There's no server-side query param for search/status/sort ([[documentApi]]`.getDocuments()` takes no arguments) — this is a client-side-only filter over whatever `getDocuments` already returned. If the document list ever grows large enough to need server-side pagination/filtering, this component's shape (controlled inputs reporting up to a parent) can stay the same; only where the filtering happens would change.
