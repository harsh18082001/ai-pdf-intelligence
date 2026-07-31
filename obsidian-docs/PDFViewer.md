---
tags: [frontend, component]
---
## Purpose
Renders the PDF itself (from local IndexedDB cache, not the server) with zoom/page/maximize controls, and lets the user re-attach the file if it isn't cached on this device.

## Key Details
- `PDFViewer({ documentId }: PDFViewerProps)`
- On mount / `documentId` change: `loadPDF(documentId)` from [[pdfStorage]] populates `pdfFile: Blob | null`. **The PDF binary is never fetched from the backend** — there is no server endpoint that serves the raw file; only the local IndexedDB copy (saved at upload time) is ever shown.
- If `pdfFile` is `null` (e.g. different browser/device than the one that uploaded it): shows a "PDF Preview Not Stored On This Device" empty state with an "Attach PDF to View Preview" button. `handleAttachPDF` opens a native file picker, and on selection calls `savePDF(documentId, file)` (from [[pdfStorage]]) then sets `pdfFile` directly — this is the "attach PDF for cross-device viewer" feature from commit `2d1da58`.
- Uses `react-pdf`'s `<Document>`/`<Page>`; configures `pdfjs.GlobalWorkerOptions.workerSrc` to load the PDF.js worker from the `unpkg` CDN matching the installed `pdfjs` version.
- State: `numPages`, `pageNumber`, `scale` (0.5–3.0, step 0.25), `pageInput` (text box, committed on Enter with bounds validation), `isMaximized`, `loadingLocal`.
- Zoom/page controls are disabled whenever `!pdfFile`.

## Source
`client/src/components/documents/PDFViewer.tsx`

## Dependencies
- Imports: `react-pdf` (`Document`, `Page`, `pdfjs`), [[pdfStorage]] (`loadPDF`, `savePDF`), `sonner` (`toast`), shadcn `Button`/`Input`.
- Used by: [[DocumentPage]].

## Related
- [[DocumentPage]]
- [[pdfStorage]]
- [[Known-Issues-and-Conventions#PDF preview is device-local, not server-backed]]

## Notes
Because the preview is 100% client-cached, AI features (chat/summary/insights) work regardless of whether the PDF preview is visible — the empty state explicitly says so. Do not "fix" this by silently trying to fetch the PDF from the server; no such endpoint exists (see [[API-Contract]]).
