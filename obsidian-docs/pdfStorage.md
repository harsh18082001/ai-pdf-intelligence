---
tags: [frontend, service]
---
## Purpose
Client-side IndexedDB persistence for raw PDF binaries, keyed by document ID — the entire "cross-device attach" / zero-network PDF preview mechanism.

## Key Details
- Uses `idb` (`openDB`). `DB_NAME = 'dociq_pdfs'`, `STORE_NAME = 'pdfs'`, schema version `1`.
- `initDB()` — opens/creates the DB; `upgrade` creates the object store if missing.
- `savePDF(documentId: number, file: File): Promise<void>` — `db.put(STORE_NAME, file, documentId)` (key = documentId, value = the `File`/`Blob`).
- `loadPDF(documentId: number): Promise<Blob | null>` — `db.get(...)`, returns `null` if not found.
- `deletePDF(documentId: number): Promise<void>` — `db.delete(...)`.
- No size limits, expiry, or eviction — entries persist until explicitly deleted or the browser clears site storage.

## Source
`client/src/services/pdfStorage.ts`

## Dependencies
- Imports: `idb`.
- Used by: [[UploadModal]] (`savePDF` after successful upload), [[PDFViewer]] (`loadPDF` on mount, `savePDF` from the "Attach PDF" flow), [[DocumentCard]] (`deletePDF` alongside server delete).

## Related
- [[PDFViewer]]
- [[UploadModal]]
- [[DocumentCard]]
- [[Data-Flow#1. Upload flow]]
- [[Known-Issues-and-Conventions#PDF preview is device-local, not server-backed]]

## Notes
This is per-browser storage, not per-user — it doesn't key off `clientId` at all, only `documentId`. Two different users on the same browser profile would share/overwrite each other's cached PDF blobs for the same document ID (unlikely in practice since document IDs are server-assigned autoincrement, but worth knowing). There is no server-side equivalent: if this IndexedDB entry doesn't exist, [[PDFViewer]] shows the "attach PDF" empty state — the PDF is never served by the API.
