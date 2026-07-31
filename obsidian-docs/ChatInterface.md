---
tags: [frontend, component]
---
## Purpose
The chat panel shell on `DocumentPage`: message list + input, with a disabled state and a maximize/minimize toggle.

## Key Details
- `ChatInterface({ documentId, isReady }: ChatInterfaceProps)`
  - `documentId: number`, `isReady: boolean`
- Calls `useChat(documentId)` → `{ messages, isLoadingHistory, isStreaming, sendMessage }` (see [[useChat]]).
- Local state: `isMaximized: boolean` (toggles a fixed-position full-screen overlay via `cn`).
- If `!isReady`: renders a "Chat disabled" [[EmptyState]] (no `useChat` data shown) explaining processing must finish first.
- Otherwise renders: header (title + streaming spinner + maximize button) → scrollable message list (auto-scrolls to bottom on `messages` change via a `ref`) → [[ChatInput]].
- Message list states: loading history spinner, empty state ("No messages yet"), or a `divide-y` list of [[ChatMessage]].

## Source
`client/src/components/chat/ChatInterface.tsx`

## Dependencies
- Imports: [[useChat]] (`@/hooks/useChat`), [[ChatMessage]], [[ChatInput]], [[EmptyState]], shadcn `Button`, `cn`.
- Used by: [[DocumentPage]], which passes `documentId` and `isReady = document?.status === 'completed'`.

## Related
- [[useChat]]
- [[ChatMessage]]
- [[ChatInput]]
- [[EmptyState]]
- [[DocumentPage]]
- [[Data-Flow#2. Chat message flow]]

## Notes
`isReady` is the only gate on chat — it does not re-check status once true, so if a document is later reprocessed (not currently supported) the panel would need a fresh `isReady` value from the parent's query.
