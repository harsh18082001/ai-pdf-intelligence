---
tags: [frontend, component]
---
## Purpose
Dialog wrapper that drives the actual upload: takes a file from [[UploadDropzone]], POSTs it, then also caches it locally.

## Key Details
- `UploadModal({ trigger, autoOpenFromUrl }: UploadModalProps)` — both optional, both additive (existing callers passing no props behave exactly as before).
  - `trigger?: ReactNode` — custom trigger element (`DialogTrigger asChild`); defaults to the standard CTA button. [[AppSidebar]] passes a full-width sidebar-styled button here.
  - `autoOpenFromUrl?: boolean` — opts this instance into watching `?upload=1` in the URL (`useSearchParams`) and opening itself when present, stripping the param afterward. Only [[HomePage]]'s hero instance sets this to `true` — it's what [[command-palette]]'s "Upload Document" action uses (`navigate('/?upload=1')`) to open the modal from anywhere in the app without any shared state/context. **Only one mounted instance per page should set this** — if two `UploadModal`s with `autoOpenFromUrl` were mounted simultaneously (e.g. both the hero and the empty-state CTA on [[DocumentList]]), both would try to open at once.
- Local state: `open: boolean` (dialog visibility). Mutation: `useUploadDocumentMutation()` from [[documentApi]].
- `handleUpload(file)`: `uploadDocument(file).unwrap()` → on success, `savePDF(doc.id, file)` (from [[pdfStorage]]) to cache the raw binary locally, `toast.success`, close dialog. On error: `toast.error(error?.data?.error || 'Failed to upload document')`.
- Trigger button is a solid `bg-primary` `Button` with an `UploadCloud` icon — the old primary→`blue-600` gradient pill was removed as a generic-template pattern (see [[Frontend-Architecture]]).
- The upload request is a full round-trip: the backend synchronously runs the entire processing pipeline (extract → chunk → embed → upsert) before responding — see [[Data-Flow#1. Upload flow]] — so this mutation can be slow (seconds) for larger PDFs; the dialog stays open with the dropzone's `isLoading` spinner the whole time.

## Source
`client/src/components/documents/UploadModal.tsx`

## Dependencies
- Imports: [[documentApi]] (`useUploadDocumentMutation`), [[UploadDropzone]], [[pdfStorage]] (`savePDF`), `sonner`, `useSearchParams` (react-router-dom).
- Used by: [[HomePage]] (hero CTA, `autoOpenFromUrl`), [[DocumentList]] (empty-state CTA), [[AppSidebar]] (sidebar CTA, custom `trigger`).

## Related
- [[UploadDropzone]]
- [[documentApi]]
- [[pdfStorage]]
- [[AppSidebar]]
- [[command-palette]]
- [[Data-Flow#1. Upload flow]]

## Notes
`savePDF` runs only after the server upload succeeds — if the tab is closed mid-upload, the document exists server-side but no local PDF preview will ever be cached for it (the user would need to use the "Attach PDF" button in [[PDFViewer]] later).
