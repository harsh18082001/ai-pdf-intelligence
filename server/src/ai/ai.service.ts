import { env } from '../config/env.js';
import type { AIProvider, ChatCompletionParams } from './ai.types.js';
import { createAIProvider } from './providers/index.js';
import { logger } from '../utils/logger.js';

class AIService implements AIProvider {
  private provider: AIProvider;

  constructor() {
    this.provider = createAIProvider({
      provider: 'gemini',
      apiToken: env.GEMINI_API_KEY,
      chatModel: env.GEMINI_CHAT_MODEL,
      embeddingModel: env.GEMINI_EMBEDDING_MODEL,
    });
  }

  async chatCompletion(params: ChatCompletionParams): Promise<string> {
    logger.info({ model: env.GEMINI_CHAT_MODEL }, 'Calling chatCompletion');
    return this.withRetry(() => this.provider.chatCompletion(params));
  }

  async *chatCompletionStream(params: ChatCompletionParams): AsyncIterable<string> {
    logger.info({ model: env.GEMINI_CHAT_MODEL }, 'Calling chatCompletionStream');
    // For streams, retrying the whole stream isn't straightforward in an async generator.
    // Assuming the initial connection failure is caught, but mid-stream failures would break.
    // For MVP, we pass it through directly.
    yield* this.provider.chatCompletionStream(params);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    logger.info({ model: env.GEMINI_EMBEDDING_MODEL, length: text.length }, 'Calling generateEmbedding');
    return this.withRetry(() => this.provider.generateEmbedding(text));
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    logger.info(
      { model: env.GEMINI_EMBEDDING_MODEL, count: texts.length },
      'Calling generateEmbeddings'
    );
    return this.withRetry(() => this.provider.generateEmbeddings(texts));
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt > maxRetries) {
          throw error;
        }
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        logger.warn({ err: error, attempt, nextDelayMs: delay }, 'AI operation failed, retrying');
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Unreachable');
  }
}

export const aiService = new AIService();
