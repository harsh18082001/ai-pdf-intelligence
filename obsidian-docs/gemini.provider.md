---
tags: [backend, ai]
---
## Purpose
Concrete `AIProvider` implementation for Google Gemini: chat completion (blocking + streaming), embeddings, and an automatic same-request fallback across multiple model names on transient errors.

## Key Details
- `class GeminiProvider implements AIProvider` — constructor `(apiKey, chatModelName, embeddingModelName)`, builds `GoogleGenerativeAI` client and two `GenerativeModel` instances (chat, embedding) via `genAI.getGenerativeModel({ model })`.
- `chatCompletion(params)`: builds a single flattened prompt string via `formatMessagesToPrompt` (see below), calls `chatModel.generateContent(prompt)`. On `error.status` of `503 | 429 | 404`, tries a hardcoded fallback list in order — `['gemini-3.5-flash', 'gemma-4-26b-a4b-it', 'gemini-flash-lite-latest']` — instantiating a fresh `GenerativeModel` per fallback name and returning the first one that succeeds. If all fail (or the error wasn't one of those statuses), rethrows.
- `chatCompletionStream(params)`: same fallback logic, but for `generateContentStream`; iterates `result.stream`, `yield`ing each non-empty `chunk.text()`.
- `generateEmbedding(text)`: `embeddingModel.embedContent(text)` → `result.embedding.values`.
- `generateEmbeddings(texts)`: `embeddingModel.batchEmbedContents({ requests: texts.map(t => ({ content: { role: 'user', parts: [{ text: t }] } })) })` → `result.embeddings.map(e => e.values)`.
- `private formatMessagesToPrompt(messages)`: Gemini's `generateContent` here is called with a **plain string**, not a structured chat/turn array — so `ChatMessage[]` is flattened as `"SYSTEM:\n...\n\nUSER:\n...\n\nASSISTANT:\n..."` (role name upper-cased, joined by blank lines). This means Gemini sees one long unstructured prompt, not native multi-turn chat formatting.

## Source
`server/src/ai/providers/gemini.provider.ts`

## Dependencies
- Imports: `@google/generative-ai` (`GoogleGenerativeAI`, `GenerativeModel`), `AIProvider`/`ChatCompletionParams` types.
- Instantiated by: `createAIProvider` in [[providers-index|ai/providers/index.ts]].
- Wrapped by: [[ai.service]] (adds logging + its own separate retry layer on top of this file's fallback logic).

## Related
- [[ai.service]]
- [[providers-index|ai/providers/index.ts]]
- [[Dependencies#Google Gemini]]

## Notes
Two layers of resilience exist and can compound: [[ai.service]]`.withRetry` retries the *whole* `chatCompletion` call (including this file's internal fallback cascade) up to 2 more times with backoff — so a persistent primary-model outage could attempt primary + 3 fallbacks, three separate times (up to 12 model calls), before finally throwing. `chatCompletionStream` has no outer retry (see [[ai.service]] Notes), only this file's inline fallback-before-streaming-starts logic; a failure *mid-stream* (after `result.stream` begins yielding) is not caught or retried at all — it propagates straight out of the generator. The fallback model list is currently hardcoded here (not env-configurable) — changing fallback models means editing this file directly, in two places (`chatCompletion` and `chatCompletionStream`, kept in sync manually).
