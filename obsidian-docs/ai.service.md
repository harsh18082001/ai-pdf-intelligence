---
tags: [backend, service]
---
## Purpose
Provider-agnostic facade over the configured AI provider (currently only Gemini), adding structured logging and retry-with-backoff around every call.

## Key Details
- `class AIService implements AIProvider` (see [[templates|ai/ai.types.ts]] for the `AIProvider` interface shape), singleton export `aiService`.
- Constructor: `this.provider = createAIProvider({ provider: 'gemini', apiToken: env.GEMINI_API_KEY, chatModel: env.GEMINI_CHAT_MODEL, embeddingModel: env.GEMINI_EMBEDDING_MODEL })` — see [[providers-index|ai/providers/index.ts]].
- `chatCompletion(params)`, `generateEmbedding(text)`, `generateEmbeddings(texts)` — each logs then calls `this.withRetry(() => this.provider.<method>(params))`.
- `chatCompletionStream(params)` — an async generator; **does not use `withRetry`** (a code comment explains: "retrying the whole stream isn't straightforward in an async generator... mid-stream failures would break" — passed straight through to the provider for MVP).
- `private withRetry<T>(operation, maxRetries = 2, baseDelayMs = 1000): Promise<T>` — exponential backoff (`baseDelayMs * 2^(attempt-1)`), retries up to 2 additional times (3 total attempts) on any thrown error, then rethrows.

## Source
`server/src/ai/ai.service.ts`

## Dependencies
- Imports: `env`, `AIProvider`/`ChatCompletionParams` types, `createAIProvider` from [[providers-index|ai/providers/index.ts]], `logger`.
- Wraps: [[gemini.provider]] (the only registered provider).
- Called by: [[chat.service]] (`generateEmbedding`, `chatCompletion`, `chatCompletionStream`), [[command.service]] (`chatCompletion`), [[processing.service]] (`generateEmbeddings`).

## Related
- [[gemini.provider]]
- [[chat.service]]
- [[command.service]]
- [[processing.service]]
- [[Dependencies#Google Gemini]]

## Notes
`withRetry` blindly retries on *any* thrown error, including validation-type errors that would never succeed on retry — it doesn't distinguish transient (429/503) from permanent failures itself; that distinction is instead handled one layer down inside [[gemini.provider]]'s own fallback-model logic. Streaming calls have no retry at all — a mid-stream Gemini failure surfaces directly to [[chat.controller]]'s `streamMessage` catch block, which sends an SSE `{ error }` event and ends the connection (partial content already streamed to the user is not rolled back).
