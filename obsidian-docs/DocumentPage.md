---
tags: [frontend, page]
---
## Purpose
Document detail view / workspace: a compact header, chat, and the PDF viewer.

## Key Details
- `export function DocumentPage()` — reads `id` from the route via `useParams<{ id: string }>()`, parsed with `parseInt(id || '0', 10)` into `documentId: number`.
- Calls `useGetDocumentQuery(documentId, { skip: !documentId })` from [[documentApi]] (shares the RTK Query cache entry with [[DocumentHeader]]'s own call — one network request, not two).
- If `!documentId || isError`: renders a "Document not found" [[EmptyState]] with a "Return Home" button (`navigate('/')`).
- Title/status/metadata/AI-actions are entirely owned by [[DocumentHeader]] now (`<DocumentHeader documentId={documentId} />`), spanning the full width above the workspace — see that note for why [[PageHeader]] and `MetadataPanel` (both retired/deleted) were merged into it.
- `isReady = document?.status === 'completed'` — gates chat: passed to [[ChatInterface]] as the `isReady` prop.
- Layout is responsive via [[useMediaQuery]] (`(min-width: 1024px)`, the same breakpoint as Tailwind's `lg`), not pure CSS: at desktop width, [[ChatInterface]] alone and [[PDFViewer]] sit in a draggable `ResizablePanelGroup` (`components/ui/resizable.tsx`, `direction="horizontal"`, left panel `defaultSize={42}` `minSize={28}` `maxSize={55}`); below that width it falls back to a stacked flex-col (chat, then a fixed `h-[600px]` PDF viewer) — resizable panels aren't used on mobile at all, by design.
  - **Chat gets the entire left pane by itself** — this is the fix for user feedback that the workspace looked "compressed"/"congested": the previous layout stacked a card-based metadata panel *above* chat inside that same narrow pane, squeezing both. Now only [[ChatInterface]] occupies it, so its message list has the full pane height to itself. See [[Known-Issues-and-Conventions#DocumentPage was rebuilt because the workspace felt "compressed" (congestion feedback)]].
- The page root is no longer inside a `container mx-auto` max-width wrapper — it's full-bleed within the sidebar layout (`h-full flex flex-col`), unlike [[HomePage]] which keeps its `container max-w-7xl`. Deliberate: a working document view should use the available width; a dashboard grid reads better constrained.
- **No longer calls `useRecentDocuments()` at all.** Recording a visit is now a side effect of the `getDocument` fetch itself (server-side `touchAccessed`, see [[document.service]]) — [[AppSidebar]]'s "Recent" list is fed by a separate query ([[useRecentDocuments]] → `GET /api/documents/recent`), not anything this page does explicitly.
- Sets `document.title`/`noindex` via [[useDocumentHead]] (a small hand-rolled hook, not `react-helmet-async` — see [[Known-Issues-and-Conventions#`react-helmet-async` doesn't support React 19 — don't try to reinstall it]]) since document content is private per-owner and should never be indexed.
- Route: `/documents/:id`, defined in `App.tsx`.

## Source
`client/src/pages/DocumentPage.tsx`

## Dependencies
- Imports: [[documentApi]] (`useGetDocumentQuery`), [[DocumentHeader]], [[PDFViewer]], [[ChatInterface]], [[EmptyState]], `ResizablePanelGroup`/`ResizablePanel`/`ResizableHandle` (`components/ui/resizable.tsx`), [[useMediaQuery]], [[useDocumentHead]].
- Rendered by: `App.tsx` route `documents/:id`, inside [[Layout]].

## Related
- [[DocumentHeader]]
- [[PDFViewer]]
- [[ChatInterface]]
- [[EmptyState]]
- [[useMediaQuery]]
- [[useRecentDocuments]]
- [[documentApi]]
- [[AppSidebar]] (collapsible — see its note for why this page cares)
- [[Frontend-Architecture]]

## Notes
`documentId` of `0` (invalid/missing param) intentionally short-circuits the query via `skip` — don't remove the `skip` guard or an invalid route will fire a request for id `0`. If you're tempted to bring back a stacked metadata card above chat, read [[Known-Issues-and-Conventions#DocumentPage was rebuilt because the workspace felt "compressed" (congestion feedback)]] first — that's exactly the shape that was deliberately removed.
