---
tags: [frontend, component]
---
## Purpose
Renders one chat bubble (avatar + markdown content) for a user, assistant, or (hidden) system message.

## Key Details
- `ChatMessage({ message }: ChatMessageProps)` where `message: IChatMessage` (the `ChatMessage` type exported from [[useChat]]).
- `message.role === 'system'` → returns `null` (system messages are never shown).
- `isUser = message.role === 'user'` drives avatar icon (`User` vs `Bot`) and background tint.
- Renders `message.content` through `ReactMarkdown` with `remarkGfm` for GitHub-flavored markdown (tables, strikethrough, etc.) inside a `prose` wrapper.
- If `!message.content && message.isStreaming`: shows a "Thinking..." spinner instead of markdown.
- If `message.isStreaming && message.content`: appends a blinking cursor `<span>` after the rendered markdown.

## Source
`client/src/components/chat/ChatMessage.tsx`

## Dependencies
- Imports: `ReactMarkdown`, `remarkGfm`, shadcn `Avatar`, `cn`, and the `ChatMessage` type from [[useChat]] (aliased `IChatMessage`).
- Used by: [[ChatInterface]] (mapped over `messages`).

## Related
- [[useChat]]
- [[ChatInterface]]

## Notes
Content is rendered as Markdown, not escaped HTML — if the Gemini response ever needs to be sanitized against injected HTML, this is the render boundary to add it at.
