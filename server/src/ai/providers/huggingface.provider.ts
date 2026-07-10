import { InferenceClient } from '@huggingface/inference';
import type { AIProvider, ChatCompletionParams } from '../ai.types.js';
import { AppError } from '../../middlewares/error-handler.js';
import { logger } from '../../utils/logger.js';

export class HuggingFaceProvider implements AIProvider {
  private client: InferenceClient;
  private chatModel: string;
  private embeddingModel: string;

  constructor(apiToken: string, chatModel: string, embeddingModel: string) {
    this.client = new InferenceClient(apiToken);
    this.chatModel = chatModel;
    this.embeddingModel = embeddingModel;
  }

  async chatCompletion(params: ChatCompletionParams): Promise<string> {
    try {
      const response = await this.client.chatCompletion({
        model: this.chatModel,
        messages: params.messages as any,
        max_tokens: params.maxTokens || 1024,
        temperature: params.temperature || 0.7,
      });

      return response.choices[0]?.message.content || '';
    } catch (error: any) {
      logger.error({ err: error }, 'Hugging Face chatCompletion error');
      throw new AppError(`AI API Error: ${error.message}`, 502);
    }
  }

  async *chatCompletionStream(params: ChatCompletionParams): AsyncIterable<string> {
    try {
      const stream = this.client.chatCompletionStream({
        model: this.chatModel,
        messages: params.messages as any,
        max_tokens: params.maxTokens || 1024,
        temperature: params.temperature || 0.7,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    } catch (error: any) {
      logger.error({ err: error }, 'Hugging Face chatCompletionStream error');
      throw new AppError(`AI API Error: ${error.message}`, 502);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embedding = await this.client.featureExtraction({
        model: this.embeddingModel,
        inputs: text,
      });
      return embedding as number[];
    } catch (error: any) {
      logger.error({ err: error }, 'Hugging Face generateEmbedding error');
      throw new AppError(`AI API Error: ${error.message}`, 502);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      if (texts.length === 0) return [];
      
      const embeddings = await this.client.featureExtraction({
        model: this.embeddingModel,
        inputs: texts,
      });
      
      // If we passed a single text it might return a 1D array.
      // We pass an array of strings so it should return 2D.
      return embeddings as number[][];
    } catch (error: any) {
      logger.error({ err: error }, 'Hugging Face generateEmbeddings error');
      throw new AppError(`AI API Error: ${error.message}`, 502);
    }
  }
}
