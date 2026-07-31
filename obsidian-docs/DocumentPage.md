---
tags: [frontend, page]
---
## Purpose
Document detail view: metadata panel + chat side-by-side with the PDF viewer.

## Key Details
- `export function DocumentPage()` — reads `id` from the route via `useParams<{ id: string }>()`, parsed with `parseInt(id || '0', 10)` into `documentId: number`.
- Calls `useGetDocumentQuery(documentId, { skip: !documentId })` from [[documentApi]].
- If `!documentId || isError`: renders a "Document not found" empty state with a "Return Home" button (`navigate('/')`).
- `isReady = document?.status === 'completed'` — gates chat: passed to [[ChatInterface]] as the `isReady` prop. Metadata and PDF viewer render regardless of status.
- Layout: left column (1/3 width on `lg`) stacks [[MetadataPanel]] then [[ChatInterface]]; right column (2/3 width) is [[PDFViewer]].
- Route: `/documents/:id`, defined in `App.tsx`.

## Source
`client/src/pages/DocumentPage.tsx`

## Dependencies
- Imports: [[documentApi]] (`useGetDocumentQuery`), [[MetadataPanel]], [[PDFViewer]], [[ChatInterface]].
- Rendered by: `App.tsx` route `documents/:id`, inside [[Layout]].

## Related
- [[MetadataPanel]]
- [[PDFViewer]]
- [[ChatInterface]]
- [[documentApi]]
- [[Frontend-Architecture]]

## Notes
`documentId` of `0` (invalid/missing param) intentionally short-circuits the query via `skip` — don't remove the `skip` guard or an invalid route will fire a request for id `0`.
