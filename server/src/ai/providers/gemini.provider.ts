import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, ChatCompletionParams } from '../ai.types.js';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenerativeAI;
  private chatModel: string;
  private embeddingModel: string;

  constructor(apiKey: string, chatModel: string, embeddingModel: string) {
    this.ai = new GoogleGenerativeAI(apiKey);
    this.chatModel = chatModel;
    this.embeddingModel = embeddingModel;
  }

  async chatCompletion(params: ChatCompletionParams): Promise<string> {
    const model = this.ai.getGenerativeModel({ model: this.chatModel });
    
    // Gemini handles system instructions separately
    const systemMsg = params.messages.find((m) => m.role === 'system');
    if (systemMsg) {
      model.systemInstruction = systemMsg.content;
    }

    const chatMessages = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const result = await model.generateContent({
      contents: chatMessages,
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxTokens,
      },
    });

    return result.response.text();
  }

  async *chatCompletionStream(params: ChatCompletionParams): AsyncIterable<string> {
    const model = this.ai.getGenerativeModel({ model: this.chatModel });

    const systemMsg = params.messages.find((m) => m.role === 'system');
    if (systemMsg) {
      model.systemInstruction = systemMsg.content;
    }

    const chatMessages = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const result = await model.generateContentStream({
      contents: chatMessages,
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxTokens,
      },
    });

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.ai.getGenerativeModel({ model: this.embeddingModel });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const model = this.ai.getGenerativeModel({ model: this.embeddingModel });
    
    // Gemini doesn't have a direct batch array API like OpenAI, but it has embedContentBatch
    const requests = texts.map((text) => ({
      content: { role: 'user', parts: [{ text }] }
    }));

    const result = await model.batchEmbedContents({
      requests,
    });
    
    return result.embeddings.map((e) => e.values);
  }
}
