---
tags: [frontend, component]
---
## Purpose
Drag-and-drop / click-to-browse PDF file picker with a local "selected file" preview step before upload.

## Key Details
- `UploadDropzone({ onFileSelect, isLoading }: UploadDropzoneProps)`
  - `onFileSelect: (file: File) => void`, `isLoading?: boolean`
- Local state: `isDragging: boolean`, `selectedFile: File | null`.
- Accepts only `file.type === 'application/pdf'` on both drop and file-input change (silently ignores non-PDF files — no error toast here).
- Two render modes: (1) no file selected → dropzone with hidden `<input type="file">`; (2) file selected → filename/size preview + "Process Document" button that calls `onFileSelect(selectedFile)` and an X button (`handleClear`) to reset.
- Does not call any API itself — purely a controlled file-selection UI; upload happens in the parent.

## Source
`client/src/components/documents/UploadDropzone.tsx`

## Dependencies
- Imports: shadcn `Button`, `cn`, `lucide-react` icons.
- Used by: [[UploadModal]] (passes `handleUpload` as `onFileSelect`, and its mutation's `isLoading`).

## Related
- [[UploadModal]]

## Notes
Max file size (50MB) is only advisory text here — the real enforcement is server-side (`express-fileupload`'s `limits.fileSize` in [[Backend-Architecture]] and the `MAX_FILE_SIZE_MB` env var). A larger file will pass this component and fail on the network request.
