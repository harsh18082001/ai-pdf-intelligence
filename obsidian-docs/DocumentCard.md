---
tags: [frontend, component]
---
## Purpose
One tile in the document grid: title, size/page badges, status badge, delete action, links to the document page.

## Key Details
- `DocumentCard({ document }: DocumentCardProps)` where `document: DocumentDTO` (see [[Frontend-Architecture#Shared types]]).
- Wraps the whole card in a `<Link to="/documents/:id">`.
- Status badge is now [[DocumentStatusBadge]] (`<DocumentStatusBadge status={document.status} />`) — the status→label/icon/tone mapping was extracted to `lib/document-status.ts` and is shared with [[DocumentHeader]] (formerly `MetadataPanel`, since deleted), no longer duplicated.
- Delete flow: click → `AlertDialog` confirmation → `handleConfirmDelete` calls `useDeleteDocumentMutation()` (from [[documentApi]]) then `deletePDF(document.id)` (from [[pdfStorage]]) to also purge the local IndexedDB copy → `toast.success`/`toast.error` (sonner).
- Delete button click handlers call `e.preventDefault(); e.stopPropagation()` so the click doesn't navigate via the wrapping `Link`.
- No longer uses `.glass`; hover state is `shadow-sm → shadow-md` + a small `-translate-y-0.5` lift instead.
- The file-icon badge (top-left `FileText` in a rounded square) tints by the document's status **tone**, not always `primary` — a local `ICON_TONE_CLASSES` map (`success`/`info`/`warning`/`danger`/`neutral` → `bg-{tone}/10 text-{tone}`) keyed off `getDocumentStatusConfig(document.status).tone` from [[document-status]]. Part of the same pass that color-coded [[AppSidebar]]'s nav icons — see [[Known-Issues-and-Conventions#The palette is genuinely multi-color now, not just a different single hue (colorfulness feedback)]].

## Source
`client/src/components/documents/DocumentCard.tsx`

## Dependencies
- Imports: [[documentApi]] (`useDeleteDocumentMutation`), [[pdfStorage]] (`deletePDF`), `sonner` (`toast`), [[DocumentStatusBadge]], shadcn `Card`/`Button`/`AlertDialog` primitives.
- Used by: [[DocumentList]] (mapped over the documents array).

## Related
- [[DocumentList]]
- [[documentApi]]
- [[pdfStorage]]
- [[DocumentStatusBadge]]
- [[document-status]]

## Notes
Deleting is two independent calls (server delete + local IndexedDB delete) with no rollback — if the server delete succeeds but the IndexedDB delete throws, the toast still fires as an error even though the document row is already gone server-side. `useDeleteDocumentMutation` invalidates the `Document` tag so the grid refetches regardless.
