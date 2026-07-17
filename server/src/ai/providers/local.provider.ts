import { pipeline, env } from '@xenova/transformers';
import type { AIProvider, ChatCompletionParams } from '../ai.types.js';

// Skip local check to prevent warning when no local cache is found first time
env.allowLocalModels = true;

export class LocalProvider implements AIProvider {
  private chatModelName: string;
  private embeddingModelName: string;
  private embedder: any = null;
  private generator: any = null;

  constructor(chatModel: string, embeddingModel: string) {
    this.chatModelName = chatModel;
    this.embeddingModelName = embeddingModel;
  }

  private async getEmbedder() {
    if (!this.embedder) {
      this.embedder = await pipeline('feature-extraction', this.embeddingModelName);
    }
    return this.embedder;
  }

  private async getGenerator() {
    if (!this.generator) {
      this.generator = await pipeline('text-generation', this.chatModelName);
    }
    return this.generator;
  }

  async chatCompletion(params: ChatCompletionParams): Promise<string> {
    const generator = await this.getGenerator();
    
    // Format messages for Xenova chat templates
    const chatMessages = params.messages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    // Use the model's official chat template to prevent hallucination loops
    const prompt = generator.tokenizer.apply_chat_template(chatMessages, {
      tokenize: false,
      add_generation_prompt: true,
    });

    const output = await generator(prompt, {
      max_new_tokens: params.maxTokens || 512,
      temperature: params.temperature || 0.1,
      return_full_text: false,
    });

    let text = output[0].generated_text.trim();
    // Manually strip ChatML stop tokens if transformers.js leaked them
    text = text.replace(/<\|im_end\|>/g, '').replace(/<\|endoftext\|>/g, '').trim();
    return text;
  }

  async *chatCompletionStream(params: ChatCompletionParams): AsyncIterable<string> {
    const generator = await this.getGenerator();
    
    const chatMessages = params.messages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    const prompt = generator.tokenizer.apply_chat_template(chatMessages, {
      tokenize: false,
      add_generation_prompt: true,
    });

    // Xenova/transformers doesn't support async generator streaming in JS out of the box in the same way as APIs.
    // We will generate the full text and yield it chunk by chunk as a mock stream, 
    // or use a TextStreamer if available. For simplicity and robustness in MVP, we yield words.
    const output = await generator(prompt, {
      max_new_tokens: params.maxTokens || 512,
      temperature: params.temperature || 0.1,
      return_full_text: false,
    });

    let text = output[0].generated_text.trim();
    text = text.replace(/<\|im_end\|>/g, '').replace(/<\|endoftext\|>/g, '').trim();
    
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i < words.length - 1 ? ' ' : '');
      // small delay to simulate streaming effect for the UI
      await new Promise(r => setTimeout(r, 20));
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embedder = await this.getEmbedder();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embedder = await this.getEmbedder();
    const results: number[][] = [];
    
    // Process sequentially to not overload Node memory
    for (const text of texts) {
      const output = await embedder(text, { pooling: 'mean', normalize: true });
      results.push(Array.from(output.data));
    }
    
    return results;
  }
}
