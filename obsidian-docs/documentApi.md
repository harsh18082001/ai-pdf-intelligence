---
tags: [frontend, api]
---
## Purpose
RTK Query slice for document CRUD: list, get one, upload, delete.

## Key Details
- `documentApi = baseApi.injectEndpoints({ endpoints: (builder) => ({ ... }) })` with six endpoints:
  - `getDocuments: builder.query<DocumentDTO[], void>` — `GET /api/documents`. `providesTags: ['Document']`.
  - `getRecentDocuments: builder.query<DocumentDTO[], void>` (**new**) — `GET /api/documents/recent`, server-ordered by `lastAccessedAt desc`. Replaces the old localStorage-backed recents — see [[useRecentDocuments]].
  - `getDocument: builder.query<DocumentDTO, number>` — `GET /api/documents/:id`. `providesTags: (_r,_e,id) => [{ type: 'Document', id }]`.
  - `getDocumentFileUrl: builder.query<string, number>` (**new**) — `GET /api/documents/:id/file`, returns a presigned Backblaze B2 URL (404/503 if no stored original — see [[b2-storage.service]]). Not currently called from any component — [[PDFViewer]] still reads from IndexedDB.
  - `uploadDocument: builder.mutation<DocumentDTO, File>` — unchanged; `invalidatesTags: ['Document']`.
  - `deleteDocument: builder.mutation<void, number>` — unchanged.
- Exported hooks: `useGetDocumentsQuery`, `useGetRecentDocumentsQuery`, `useGetDocumentQuery`, `useGetDocumentFileUrlQuery`, `useUploadDocumentMutation`, `useDeleteDocumentMutation`.

## Source
`client/src/api/documentApi.ts`

## Dependencies
- Imports: [[baseApi]], `ApiResponse`/`DocumentDTO` types from `@/types`.
- Used by: [[DocumentList]] (`getDocuments`), [[AppSidebar]] via [[useRecentDocuments]] (`getRecentDocuments`), [[DocumentPage]]/[[DocumentHeader]] (`getDocument`), [[UploadModal]] (`uploadDocument`), [[DocumentCard]] (`deleteDocument`).
- Backend: [[document.routes]] → [[document.controller]] → [[document.service]] → [[document.repository]].

## Related
- [[document.routes]]
- [[document.controller]]
- [[API-Contract]]
- [[Data-Flow#1. Upload flow]]

## Notes
`uploadDocument`'s request is a `multipart/form-data` POST that the backend processes **synchronously end-to-end** (extraction → chunking → embedding → Pinecone upsert) before responding — see [[processing.service]] and [[Known-Issues-and-Conventions]]. The mutation will not resolve until the whole pipeline finishes or fails, which can take several seconds.
