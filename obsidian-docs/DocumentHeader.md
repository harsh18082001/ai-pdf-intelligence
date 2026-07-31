---
tags: [frontend, component]
---
## Purpose
The compact top strip for [[DocumentPage]]: breadcrumb, title, status badge, inline metadata chips, and the AI-actions dropdown — replaces the old [[PageHeader]] + `MetadataPanel` pairing (both retired/deleted).

## Key Details
- `DocumentHeader({ documentId }: DocumentHeaderProps)` — fetches its own data via `useGetDocumentQuery(documentId)` (shares the RTK Query cache with [[DocumentPage]]'s own call to the same query — one network request, not two).
- Layout: a "Home / <title>" breadcrumb row, then a `flex-wrap` row with (left) back-arrow + serif `<h1>` title + [[DocumentStatusBadge]], and (right) inline `date • size • pages` chips (hidden below `sm`) + an "Actions" `DropdownMenu` button.
- The Actions dropdown replaces what used to be three separate stacked `Button`s in `MetadataPanel` — same three commands (`summary`/`key_points`/`insights`), same `handleCommand`/result-`Dialog` logic, just one menu instead of a permanently-visible button list. Only rendered when `document.status === 'completed'`.
- `document.errorMsg` (set on `failed`/`ocr_required`) renders as a slim inline destructive banner below the title row, not a separate card.
- Loading state is two `Skeleton` bars (breadcrumb-width, then title-width) rather than a full card skeleton.
- This component owns the entire AI-command execution + result-dialog flow that `MetadataPanel` used to own — see [[commandApi]]/[[command.service]] for the backend side.

## Source
`client/src/components/documents/DocumentHeader.tsx`

## Dependencies
- Imports: [[documentApi]] (`useGetDocumentQuery`), [[commandApi]] (`useExecuteCommandMutation`), [[DocumentStatusBadge]], the `Skeleton`/`Dialog`/`DropdownMenu` ui primitives, `ReactMarkdown`+`remarkGfm` for rendering the AI result.
- Used by: [[DocumentPage]] (`<DocumentHeader documentId={documentId} />`, spanning the full width above the resizable panes).

## Related
- [[DocumentPage]]
- [[DocumentStatusBadge]]
- [[commandApi]]
- [[command.service]]
- [[PageHeader]] (retired — merged in)
- [[MetadataPanel]] (retired — merged in)
- [[Known-Issues-and-Conventions#DocumentPage was rebuilt because the workspace felt "compressed" (congestion feedback)]]

## Notes
If you add a fourth AI command, add it to the `AI_COMMANDS` array here (not a new standalone button) — that array drives the Actions dropdown.
