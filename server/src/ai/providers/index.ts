import type { AIProvider, AIServiceConfig } from '../ai.types.js';
import { LocalProvider } from './local.provider.js';

export function createAIProvider(config: AIServiceConfig): AIProvider {
  switch (config.provider) {
    case 'local':
      return new LocalProvider(config.chatModel, config.embeddingModel);
    // Other providers like 'openai' or 'ollama' can be added here
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
