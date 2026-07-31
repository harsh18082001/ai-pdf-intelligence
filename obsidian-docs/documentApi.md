---
tags: [frontend, api]
---
## Purpose
RTK Query slice for document CRUD: list, get one, upload, delete.

## Key Details
- `documentApi = baseApi.injectEndpoints({ endpoints: (builder) => ({ ... }) })` with four endpoints:
  - `getDocuments: builder.query<DocumentDTO[], void>` — `query: () => '/documents'` → `GET /api/documents` → [[document.routes]] → [[document.controller]] `listDocuments` → [[document.service]] `list`. `transformResponse` → `response.data || []`. `providesTags: ['Document']`.
  - `getDocument: builder.query<DocumentDTO, number>` — `query: (id) => `/documents/${id}`` → `GET /api/documents/:id`. `transformResponse` → `response.data!`. `providesTags: (_r,_e,id) => [{ type: 'Document', id }]`.
  - `uploadDocument: builder.mutation<DocumentDTO, File>` — builds a `FormData` with the file under key `'file'`, `POST /api/documents`. `invalidatesTags: ['Document']`.
  - `deleteDocument: builder.mutation<void, number>` — `DELETE /api/documents/:id`. `invalidatesTags: ['Document']`.
- Exported hooks: `useGetDocumentsQuery`, `useGetDocumentQuery`, `useUploadDocumentMutation`, `useDeleteDocumentMutation`.

## Source
`client/src/api/documentApi.ts`

## Dependencies
- Imports: [[baseApi]], `ApiResponse`/`DocumentDTO` types from `@/types`.
- Used by: [[DocumentList]] (`getDocuments`), [[DocumentPage]]/[[DocumentHeader]] (`getDocument`), [[UploadModal]] (`uploadDocument`), [[DocumentCard]] (`deleteDocument`).
- Backend: [[document.routes]] → [[document.controller]] → [[document.service]] → [[document.repository]].

## Related
- [[document.routes]]
- [[document.controller]]
- [[API-Contract]]
- [[Data-Flow#1. Upload flow]]

## Notes
`uploadDocument`'s request is a `multipart/form-data` POST that the backend processes **synchronously end-to-end** (extraction → chunking → embedding → Pinecone upsert) before responding — see [[processing.service]] and [[Known-Issues-and-Conventions]]. The mutation will not resolve until the whole pipeline finishes or fails, which can take several seconds.
