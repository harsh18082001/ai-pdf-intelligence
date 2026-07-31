---
tags: [frontend, hook]
---
## Purpose
Owns chat state for one document: loads history via RTK Query, streams new turns over SSE, merges the two into a single message list.

## Key Details
- `export interface ChatMessage { id: string | number; role: 'user' | 'assistant' | 'system'; content: string; isStreaming?: boolean }`
- `useChat(documentId: number)` returns `{ messages, isLoadingHistory, isStreaming, sendMessage }`.
- `history` comes from `useGetChatHistoryQuery(documentId, { skip: !documentId })` ([[chatApi]]). `messages` (local state) holds only in-flight optimistic user+assistant turns; `allMessages = [...history, ...messages]` is what's returned as `messages`.
- A `useEffect` on `[history]` clears the local `messages` array whenever server history changes — this is how temporary streamed messages get replaced by the persisted ones without duplicating.
- `sendMessage(content)`:
  1. Guards on `!content.trim() || isStreaming`.
  2. Optimistically appends a user message (`id: Date.now()`) and an empty streaming assistant message (`id: Date.now()+1`).
  3. Opens `new EventSource(`${VITE_API_URL}/documents/${documentId}/chat/stream?message=...&clientId=...`)` — `clientId` read directly from `localStorage.getItem('dociq_client_id')` (not from [[AuthContext]]'s hook, since `EventSource` can't be inside a component's hook tree conveniently — this is a raw browser API call).
  4. `onmessage`: `data === '[DONE]'` → closes the stream, sets `isStreaming = false`, dispatches `chatApi.util.invalidateTags([{ type: 'Message', id: documentId }])` to force `useGetChatHistoryQuery` to refetch (which then clears local `messages` via the effect above). Otherwise parses `JSON.parse(data)` as a text chunk (or `{ error }`) and appends to the assistant message's `content`.
  5. `onerror`: toasts "Connection lost..." and stops the streaming flag, leaving whatever partial content was received.

## Source
`client/src/hooks/useChat.ts`

## Dependencies
- Imports: [[chatApi]] (`useGetChatHistoryQuery`, `chatApi.util.invalidateTags`), `useAppDispatch` from [[store]].
- Used by: [[ChatInterface]].
- Calls: `GET /api/documents/:documentId/chat/stream` directly (bypassing RTK Query, since `fetchBaseQuery` doesn't support SSE) — see [[chat.routes]] / [[chat.controller]].

## Related
- [[ChatInterface]]
- [[chatApi]]
- [[chat.controller]]
- [[Data-Flow#2. Chat message flow]]

## Notes
The `EventSource` URL is built with `import.meta.env.VITE_API_URL` directly rather than going through [[baseApi]]'s `fetchBaseQuery`, so it does **not** send the `x-client-id` header the backend normally reads — instead `clientId` is appended as a query string param, and [[chat.controller]]'s `getClientId()` checks header → query → body in that order, so this still works. If you change the client-id transport mechanism, you must update both `baseApi.ts` and this file.
