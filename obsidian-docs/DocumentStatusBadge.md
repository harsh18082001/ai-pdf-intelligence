---
tags: [frontend, component]
---
## Purpose
Shared status pill for a document — renders the right icon/label/color for `completed`/`processing`/`failed`/`ocr_required`/pending, wherever a status needs to show.

## Key Details
- `DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps)`.
- Looks up `{ label, icon, tone, spin }` via `getDocumentStatusConfig(status)` from [[document-status]], then renders the `Badge` ui primitive with `variant={tone}` and the icon (spinning via `animate-spin` when `spin` is true, e.g. `processing`).
- Replaces the `getStatusConfig` function that used to be duplicated verbatim in [[DocumentCard]] and `MetadataPanel` (now [[DocumentHeader]], since `MetadataPanel` was deleted).

## Source
`client/src/components/documents/DocumentStatusBadge.tsx`

## Dependencies
- Imports: [[document-status]] (`getDocumentStatusConfig`), the `Badge` ui primitive (its `success`/`warning`/`info`/`danger`/`neutral` tone variants), `cn` from `@/lib/utils`.
- Used by: [[DocumentCard]] (grid tile), [[DocumentHeader]] (detail panel).

## Related
- [[document-status]]
- [[DocumentCard]]
- [[DocumentHeader]]
- [[Frontend-Architecture#Design system — "Glacier" (`index.css`)]]

## Notes
Don't reintroduce a local `getStatusConfig`/status-color mapping in a new component — import this instead so all status displays stay in sync.
