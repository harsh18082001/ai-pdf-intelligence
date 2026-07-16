import type { AIProvider, AIServiceConfig } from '../ai.types.js';
import { GeminiProvider } from './gemini.provider.js';

export function createAIProvider(config: AIServiceConfig): AIProvider {
  switch (config.provider) {
    case 'gemini':
      return new GeminiProvider(config.apiToken, config.chatModel, config.embeddingModel);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
