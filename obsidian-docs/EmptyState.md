---
tags: [frontend, component]
---
## Purpose
Shared "nothing to show" layout — icon in a tinted circle + title + optional description + optional action — used everywhere a component previously hand-rolled its own empty/disabled/error placeholder.

## Key Details
- `EmptyState({ icon: Icon, title, description?, action?, className? }: EmptyStateProps)` where `icon` is any `LucideIcon`.
- Purely presentational, no data fetching or state of its own; callers pass whatever icon/copy/action fits their case.
- Lives in `components/ui/` alongside the vendored shadcn primitives, but — unlike those — is hand-written for this app (real props/behavior), so it gets its own note rather than being folded into the "not documented individually" list in [[Frontend-Architecture]].

## Source
`client/src/components/ui/empty-state.tsx`

## Dependencies
- Imports: `cn` from `@/lib/utils`.
- Used by: [[DocumentList]] (no-documents / no-matching-filter / fetch-error states), [[PDFViewer]] ("PDF preview not stored on this device"), [[ChatInterface]] ("Chat disabled"), [[DocumentPage]] ("Document not found").

## Related
- [[DocumentList]]
- [[PDFViewer]]
- [[ChatInterface]]
- [[DocumentPage]]
- [[Frontend-Architecture]]

## Notes
Before writing a new bespoke "nothing here" block in a component, check whether this covers it first — it was extracted specifically because that pattern kept getting reinvented per-component with slightly different markup.
