import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { AIProvider, ChatCompletionParams } from '../ai.types.js';

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private chatModel: GenerativeModel;
  private embeddingModel: GenerativeModel;

  constructor(apiKey: string, chatModelName: string, embeddingModelName: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.chatModel = this.genAI.getGenerativeModel({ model: chatModelName });
    this.embeddingModel = this.genAI.getGenerativeModel({ model: embeddingModelName });
  }

  async chatCompletion(params: ChatCompletionParams): Promise<string> {
    const prompt = this.formatMessagesToPrompt(params.messages);
    try {
      const result = await this.chatModel.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      if (error.status === 503 || error.status === 429 || error.status === 404) {
        console.warn(`Primary model failed with ${error.status}, trying fallbacks...`);
        const fallbacks = ['gemini-3.5-flash', 'gemma-4-26b-a4b-it', 'gemini-flash-lite-latest'];
        
        for (const fallbackName of fallbacks) {
          try {
            console.log(`Trying fallback model: ${fallbackName}`);
            const fallbackModel = this.genAI.getGenerativeModel({ model: fallbackName });
            const result = await fallbackModel.generateContent(prompt);
            return result.response.text();
          } catch (fallbackError: any) {
            console.warn(`${fallbackName} also failed with ${fallbackError.status}`);
          }
        }
      }
      throw error;
    }
  }

  async *chatCompletionStream(params: ChatCompletionParams): AsyncIterable<string> {
    const prompt = this.formatMessagesToPrompt(params.messages);
    let result;
    try {
      result = await this.chatModel.generateContentStream(prompt);
    } catch (error: any) {
      if (error.status === 503 || error.status === 429 || error.status === 404) {
        console.warn(`Primary model failed with ${error.status}, trying fallbacks...`);
        const fallbacks = ['gemini-3.5-flash', 'gemma-4-26b-a4b-it', 'gemini-flash-lite-latest'];
        
        for (const fallbackName of fallbacks) {
          try {
            console.log(`Trying fallback model: ${fallbackName}`);
            const fallbackModel = this.genAI.getGenerativeModel({ model: fallbackName });
            result = await fallbackModel.generateContentStream(prompt);
            break; // Success! Break out of the fallback loop
          } catch (fallbackError: any) {
            console.warn(`${fallbackName} also failed with ${fallbackError.status}`);
          }
        }
        
        if (!result) throw error; // If all fallbacks failed, throw the original error
      } else {
        throw error;
      }
    }
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const requests = texts.map((t) => ({
      content: { role: 'user', parts: [{ text: t }] },
    }));

    const result = await this.embeddingModel.batchEmbedContents({
      requests,
    });
    
    return result.embeddings.map((e) => e.values);
  }

  private formatMessagesToPrompt(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): string {
    return messages
      .map((m) => {
        const role = m.role.toUpperCase();
        return `${role}:\n${m.content}`;
      })
      .join('\n\n');
  }
}
