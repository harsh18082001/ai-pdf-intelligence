---
tags: [frontend, component]
---
## Purpose
Dialog wrapper that drives the actual upload: takes a file from [[UploadDropzone]], POSTs it, then also caches it locally.

## Key Details
- `export function UploadModal()` — no props.
- Local state: `open: boolean` (dialog visibility). Mutation: `useUploadDocumentMutation()` from [[documentApi]].
- `handleUpload(file)`: `uploadDocument(file).unwrap()` → on success, `savePDF(doc.id, file)` (from [[pdfStorage]]) to cache the raw binary locally, `toast.success`, close dialog. On error: `toast.error(error?.data?.error || 'Failed to upload document')`.
- The upload request is a full round-trip: the backend synchronously runs the entire processing pipeline (extract → chunk → embed → upsert) before responding — see [[Data-Flow#1. Upload flow]] — so this mutation can be slow (seconds) for larger PDFs; the dialog stays open with the dropzone's `isLoading` spinner the whole time.

## Source
`client/src/components/documents/UploadModal.tsx`

## Dependencies
- Imports: [[documentApi]] (`useUploadDocumentMutation`), [[UploadDropzone]], [[pdfStorage]] (`savePDF`), `sonner`.
- Used by: [[HomePage]] (hero CTA) and [[DocumentList]] (empty-state CTA).

## Related
- [[UploadDropzone]]
- [[documentApi]]
- [[pdfStorage]]
- [[Data-Flow#1. Upload flow]]

## Notes
`savePDF` runs only after the server upload succeeds — if the tab is closed mid-upload, the document exists server-side but no local PDF preview will ever be cached for it (the user would need to use the "Attach PDF" button in [[PDFViewer]] later).
