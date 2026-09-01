---
tags: [frontend, hook]
---
## Purpose
Owns chat state for one document: loads history via RTK Query, streams new turns over SSE (via `fetch`, not `EventSource`), merges the two into a single message list.

## Key Details
- `export interface ChatMessage { id: string | number; role: 'user' | 'assistant' | 'system'; content: string; isStreaming?: boolean }`
- `useChat(documentId: number)` returns `{ messages, isLoadingHistory, isStreaming, sendMessage }`.
- `history` comes from `useGetChatHistoryQuery(documentId, { skip: !documentId })` ([[chatApi]]). `messages` (local state) holds only in-flight optimistic user+assistant turns; `allMessages = [...history, ...messages]` is what's returned as `messages`.
- A `useEffect` on `[history]` clears the local `messages` array whenever server history changes.
- `sendMessage(content)` — **rewritten to use `fetch` + a manual `ReadableStream` reader, not `EventSource`**:
  1. Guards on `!content.trim() || isStreaming`; optimistically appends a user message and an empty streaming assistant message.
  2. `fetch(`${VITE_API_URL}/documents/${documentId}/chat/stream?message=...`, { credentials: 'include', headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined, signal })` — `accessToken` from `client/src/lib/token-store.ts`. `credentials: 'include'` sends the guest/refresh cookies; the `Authorization` header is what actually identifies a logged-in user, since cookies alone wouldn't carry the access token.
  3. Manually reads `response.body` chunk by chunk, decodes, splits on `\n\n` (SSE event boundary), and parses each `data: ...` line the same way the old `EventSource.onmessage` did — `[DONE]` → finish + invalidate the `Message` tag; `{ error }` → toast + drop the assistant message; otherwise append the chunk text.
  4. An `AbortController` (stored in a ref, aborted on unmount) replaces `EventSource.close()`.

## Source
`client/src/hooks/useChat.ts`

## Dependencies
- Imports: [[chatApi]] (`useGetChatHistoryQuery`, `chatApi.util.invalidateTags`), `useAppDispatch` from [[store]], `getAccessToken` from `client/src/lib/token-store.ts`.
- Used by: [[ChatInterface]].
- Calls: `GET /api/documents/:documentId/chat/stream` directly (bypassing RTK Query, since `fetchBaseQuery` doesn't support streaming reads) — see [[chat.routes]] / [[chat.controller]].

## Related
- [[ChatInterface]]
- [[chatApi]]
- [[chat.controller]]
- [[baseApi]]
- [[Data-Flow#2. Chat message flow]]

## Notes
**Why not `EventSource`**: the browser's native `EventSource` API has no way to set a custom header, so it couldn't attach the `Authorization: Bearer <accessToken>` header a logged-in user's request needs post-auth-overhaul (there's no cookie carrying the access token — see [[AuthContext]]/[[baseApi]]). It also can't have `credentials`/`withCredentials` configured per-request as easily and was still reading the now-deleted `localStorage['dociq_client_id']` as a query param. `fetch` supports both headers and `credentials: 'include'`, so the whole call was switched to a manual stream reader instead. If you're tempted to go back to `EventSource` for simplicity, you'd need a same-cookie-only auth story for this one endpoint (e.g. accepting the access token as a query param, which leaks it into server logs) — not recommended.
