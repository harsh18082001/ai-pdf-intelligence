export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionParams {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  chatCompletion(params: ChatCompletionParams): Promise<string>;
  chatCompletionStream(params: ChatCompletionParams): AsyncIterable<string>;
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface AIServiceConfig {
  provider: 'huggingface' | 'openai' | 'ollama' | 'gemini';
  apiToken: string;
  chatModel: string;
  embeddingModel: string;
}
