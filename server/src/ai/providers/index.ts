import type { AIProvider, AIServiceConfig } from '../ai.types.js';
import { HuggingFaceProvider } from './huggingface.provider.js';

export function createAIProvider(config: AIServiceConfig): AIProvider {
  switch (config.provider) {
    case 'huggingface':
      return new HuggingFaceProvider(config.apiToken, config.chatModel, config.embeddingModel);
    // Other providers like 'openai' or 'ollama' can be added here
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}
