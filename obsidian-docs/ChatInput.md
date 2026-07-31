---
tags: [frontend, component]
---
## Purpose
Textarea + send button for composing a chat message.

## Key Details
- `ChatInput({ onSendMessage, disabled, isStreaming }: ChatInputProps)`
  - `onSendMessage: (message: string) => void`
  - `disabled?: boolean`
  - `isStreaming?: boolean`
- Local state: `input: string` (controlled textarea value).
- Enter (without Shift) submits; Shift+Enter inserts a newline.
- Auto-resizes the textarea height (`scrollHeight`, capped at 200px) via a `useEffect` keyed on `input`.
- Submit is blocked when `!input.trim() || disabled || isStreaming`; clears `input` after calling `onSendMessage`.
- Uses shadcn/ui `Button` and `Textarea` primitives, `cn()` from [[lib-utils|lib/utils.ts]] for conditional classes.

## Source
`client/src/components/chat/ChatInput.tsx`

## Dependencies
- Imports: `Button`, `Textarea` (shadcn/ui primitives), `cn` from `@/lib/utils`.
- Used by: [[ChatInterface]], which passes its `sendMessage` (from [[useChat]]) as `onSendMessage`.

## Related
- [[ChatInterface]]
- [[useChat]]

## Notes
`onSendMessage` is fire-and-forget from this component's perspective — it does not await anything; streaming state comes back down as the `isStreaming` prop from the parent.
