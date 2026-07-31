---
tags: [backend, ai]
---
## Purpose
Factory that instantiates the configured `AIProvider` implementation.

## Key Details
```ts
export function createAIProvider(config: AIServiceConfig): AIProvider {
  switch (config.provider) {
    case 'gemini':
      return new GeminiProvider(config.apiToken, config.chatModel, config.embeddingModel);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
```
`AIServiceConfig.provider` type allows `'huggingface' | 'openai' | 'ollama' | 'gemini'` (see [[ai.service|ai/ai.types.ts]]), but only `'gemini'` has a real implementation — any other value throws at construction time.

## Source
`server/src/ai/providers/index.ts`

## Dependencies
- Imports: [[gemini.provider]], `AIProvider`/`AIServiceConfig` types.
- Called by: [[ai.service]] (constructor).

## Related
- [[ai.service]]
- [[gemini.provider]]

## Notes
If you add a second provider (e.g. OpenAI) to actually support the other listed types, this is the only file that needs a new `case` — `AIService` itself is provider-agnostic and only depends on the `AIProvider` interface.
