---
tags: [frontend, api]
---
## Purpose
RTK Query slice for reading persisted chat history (message sending is NOT done through RTK Query — see [[useChat]]).

## Key Details
- `chatApi = baseApi.injectEndpoints({ endpoints: (builder) => ({ getChatHistory: builder.query<MessageDTO[], number>(...) }) })`
- `getChatHistory(documentId: number)`:
  - `query: (documentId) => `/documents/${documentId}/chat``
  - Backend route: `GET /api/documents/:documentId/chat` → [[chat.routes]] → [[chat.controller]] `getChatHistory` → [[chat.service]] `getHistory`.
  - `transformResponse`: unwraps `{ success, data }` → `response.data || []`.
  - `providesTags: (_r, _e, documentId) => [{ type: 'Message', id: documentId }]`.
- Exported hook: `useGetChatHistoryQuery`.
- Cache invalidation for this tag happens from [[useChat]] via `chatApi.util.invalidateTags([{ type: 'Message', id: documentId }])` after an SSE stream completes — not via a mutation's `invalidatesTags`, since the actual send goes over raw `EventSource`, not this slice.

## Source
`client/src/api/chatApi.ts`

## Dependencies
- Imports: [[baseApi]], `ApiResponse`/`MessageDTO` types from `@/types`.
- Used by: [[useChat]] (query), and imperatively via `chatApi.util.invalidateTags(...)` (same file, [[useChat]]).
- Backend: [[chat.routes]] → [[chat.controller]] → [[chat.service]].

## Related
- [[useChat]]
- [[chat.routes]]
- [[chat.controller]]
- [[API-Contract]]

## Notes
There is deliberately no `sendMessage`/`streamMessage` mutation defined here — streaming responses aren't representable in `fetchBaseQuery`, so that path lives entirely in [[useChat]] using the native `EventSource` API. Don't add a `sendMessage` RTK mutation expecting it to stream; it can only do request/response.
