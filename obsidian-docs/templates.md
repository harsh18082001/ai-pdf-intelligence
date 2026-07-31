---
tags: [backend, ai]
---
## Purpose
Prompt-builder functions — the only place system/user prompt text is authored — for chat QA and the three implemented AI commands.

## Key Details
- `buildQAPrompt(question: string, contextChunks: string[], history: MessageDTO[] = []): ChatMessage[]`:
  - System message instructs the model to answer **only** from the provided context, to explicitly say "I don't have enough information..." if it can't, not to fabricate, and to use Markdown.
  - Context = `contextChunks.join('\n\n---\n\n')` interpolated into the system message.
  - Appends prior history messages (filtered to `user`/`assistant` roles only — `system` is excluded even if present) as their own `ChatMessage` entries, then the new `question` as a final `user` message.
- `buildSummaryPrompt(chunks: string[]): ChatMessage[]` — system message: "expert summarizer," full document context inlined, asks for a comprehensive Markdown summary with headings.
- `buildKeyPointsPrompt(chunks: string[]): ChatMessage[]` — system message: "analytical assistant," asks for a structured Markdown bullet list of key points.
- `buildInsightsPrompt(chunks: string[]): ChatMessage[]` — system message: "expert analyst," asks for deeper analysis (trends, implications, patterns), not just a summary.
- All three command-prompt builders join **all** chunks for the document into context (no top-K retrieval/truncation) — unlike chat, which uses only the Pinecone-retrieved top 5.

## Source
`server/src/ai/prompts/templates.ts`

## Dependencies
- Imports: `ChatMessage` type from [[ai.service|ai/ai.types.ts]], `MESSAGE_ROLES` constant, `MessageDTO` type.
- Used by: [[chat.service]] (`buildQAPrompt`), [[command.service]] (`buildSummaryPrompt`, `buildKeyPointsPrompt`, `buildInsightsPrompt`).

## Related
- [[chat.service]]
- [[command.service]]
- [[ai.service]]
- [[Data-Flow#2. Chat message flow]]
- [[Data-Flow#5. Command flow]]

## Notes
Because command prompts inline **every** chunk of the document with no token-budget truncation, a very large document (many chunks) risks exceeding `MAX_CONTEXT_TOKENS` (6000, defined in `config/constants.ts` but **not actually enforced anywhere in this file or `command.service.ts`**) or the model's real context window — there is no chunk-count/token cap applied before building these prompts. If you're debugging a "summary command fails on large documents" report, this is the likely cause; chat doesn't have this problem since it retrieves only the top 5 relevant chunks via Pinecone.
