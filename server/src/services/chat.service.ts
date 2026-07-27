import { documentRepository } from '../repositories/document.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import { aiService } from '../ai/ai.service.js';
import { pineconeService } from './pinecone.service.js';
import { buildQAPrompt } from '../ai/prompts/templates.js';
import { AppError } from '../middlewares/error-handler.js';
import { TOP_K_CHUNKS, DOCUMENT_STATUS, MESSAGE_ROLES } from '../config/constants.js';
import type { MessageDTO, StreamCallback, RequestOwner } from '../types/index.js';

class ChatService {
  private async prepareChat(documentId: number, userMessage: string, owner?: RequestOwner) {
    const doc = await documentRepository.findById(documentId, owner);
    if (!doc) throw new AppError('Document not found', 404);
    if (doc.status !== DOCUMENT_STATUS.COMPLETED) {
      throw new AppError('Document is not ready for chat. Current status: ' + doc.status, 400);
    }

    // Save user message
    await messageRepository.create({
      documentId,
      role: MESSAGE_ROLES.USER,
      content: userMessage,
    });

    // Generate embedding for user query
    const queryEmbedding = await aiService.generateEmbedding(userMessage);

    // Retrieve chunks from Pinecone (scoped by owner.id if present)
    const ownerId = owner?.id || doc.userId || doc.sessionId || undefined;
    const topChunks = await pineconeService.querySimilar(documentId, queryEmbedding, TOP_K_CHUNKS, ownerId);
    if (topChunks.length === 0) {
      throw new AppError('No document content available for context', 400);
    }

    const contextTexts = topChunks.map((c) => c.text);

    // Retrieve previous messages for chat history
    const allMessages = await messageRepository.findByDocumentId(documentId);
    const priorMessages = allMessages.slice(0, -1);
    const history = priorMessages.slice(-6).map((m) => ({
      id: m.id,
      documentId: m.documentId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    // Build prompt
    const messages = buildQAPrompt(userMessage, contextTexts, history);

    return { messages };
  }

  async sendMessage(documentId: number, userMessage: string, owner?: RequestOwner): Promise<string> {
    const { messages } = await this.prepareChat(documentId, userMessage, owner);

    const assistantResponse = await aiService.chatCompletion({ messages });

    await messageRepository.create({
      documentId,
      role: MESSAGE_ROLES.ASSISTANT,
      content: assistantResponse,
    });

    return assistantResponse;
  }

  async streamMessage(
    documentId: number,
    userMessage: string,
    onChunk: StreamCallback,
    owner?: RequestOwner
  ): Promise<string> {
    const { messages } = await this.prepareChat(documentId, userMessage, owner);

    const stream = aiService.chatCompletionStream({ messages });

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
      onChunk(chunk);
    }

    await messageRepository.create({
      documentId,
      role: MESSAGE_ROLES.ASSISTANT,
      content: fullResponse,
    });

    return fullResponse;
  }

  async getHistory(documentId: number, owner?: RequestOwner): Promise<MessageDTO[]> {
    const doc = await documentRepository.findById(documentId, owner);
    if (!doc) throw new AppError('Document not found', 404);

    const messages = await messageRepository.findByDocumentId(documentId);
    return messages.map((m) => ({
      id: m.id,
      documentId: m.documentId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }
}

export const chatService = new ChatService();
