---
tags: [frontend, component]
---
## Purpose
One tile in the document grid: title, size/page badges, status badge, delete action, links to the document page.

## Key Details
- `DocumentCard({ document }: DocumentCardProps)` where `document: DocumentDTO` (see [[Frontend-Architecture#Shared types]]).
- Wraps the whole card in a `<Link to="/documents/:id">`.
- `getStatusConfig(status)` maps `document.status` → `{ color, icon, label }` for badges: `completed`→Ready (green), `processing`→Processing (blue, spinning), `failed`→Failed (red), `ocr_required`→Needs OCR (orange), default→Pending (gray).
- Delete flow: click → `AlertDialog` confirmation → `handleConfirmDelete` calls `useDeleteDocumentMutation()` (from [[documentApi]]) then `deletePDF(document.id)` (from [[pdfStorage]]) to also purge the local IndexedDB copy → `toast.success`/`toast.error` (sonner).
- Delete button click handlers call `e.preventDefault(); e.stopPropagation()` so the click doesn't navigate via the wrapping `Link`.

## Source
`client/src/components/documents/DocumentCard.tsx`

## Dependencies
- Imports: [[documentApi]] (`useDeleteDocumentMutation`), [[pdfStorage]] (`deletePDF`), `sonner` (`toast`), shadcn `Card`/`Badge`/`Button`/`AlertDialog` primitives.
- Used by: [[DocumentList]] (mapped over the documents array).

## Related
- [[DocumentList]]
- [[documentApi]]
- [[pdfStorage]]

## Notes
Deleting is two independent calls (server delete + local IndexedDB delete) with no rollback — if the server delete succeeds but the IndexedDB delete throws, the toast still fires as an error even though the document row is already gone server-side. `useDeleteDocumentMutation` invalidates the `Document` tag so the grid refetches regardless.
