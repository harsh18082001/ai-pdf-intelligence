import { documentRepository } from '../repositories/document.repository.js';
import { chunkRepository } from '../repositories/chunk.repository.js';
import { aiArtifactRepository } from '../repositories/ai-artifact.repository.js';
import { aiService } from '../ai/ai.service.js';
import { buildSummaryPrompt, buildKeyPointsPrompt, buildInsightsPrompt } from '../ai/prompts/templates.js';
import { AppError } from '../middlewares/error-handler.js';
import { ARTIFACT_TYPES, DOCUMENT_STATUS } from '../config/constants.js';
import type { AIArtifactDTO } from '../types/index.js';

class CommandService {
  async execute(documentId: number, command: string, regenerate: boolean = false): Promise<AIArtifactDTO> {
    if (!ARTIFACT_TYPES.includes(command)) {
      throw new AppError(`Invalid command: ${command}`, 400);
    }

    const doc = await documentRepository.findById(documentId);
    if (!doc) throw new AppError('Document not found', 404);
    if (doc.status !== DOCUMENT_STATUS.COMPLETED) {
      throw new AppError('Document is not ready. Current status: ' + doc.status, 400);
    }

    // 1. Check database if not regenerating
    if (!regenerate) {
      console.log(`[Command] Checking database for ${command} on document ${documentId}`);
      const cached = await aiArtifactRepository.findByDocumentAndType(documentId, command);
      
      if (cached) {
        console.log(`[Command] Cache hit in PostgreSQL for ${command}`);
        return {
          id: cached.id,
          documentId: cached.documentId,
          type: cached.type,
          content: cached.content,
          createdAt: cached.createdAt.toISOString(),
          updatedAt: cached.updatedAt.toISOString(),
        };
      }
      console.log(`[Command] Cache miss. Generating from LLM...`);
    }

    // 2. Fetch all chunks
    const chunks = await chunkRepository.findByDocumentId(documentId);
    if (chunks.length === 0) {
      throw new AppError('No document content available', 400);
    }
    const chunkTexts = chunks.map((c) => c.text);

    // 3. Build prompt based on command
    let messages;
    switch (command) {
      case 'summary':
        messages = buildSummaryPrompt(chunkTexts);
        break;
      case 'key_points':
        messages = buildKeyPointsPrompt(chunkTexts);
        break;
      case 'insights':
        messages = buildInsightsPrompt(chunkTexts);
        break;
      default:
        // For un-implemented commands, default to a generic summary prompt for now
        // since the prompt templates only cover MVP ones.
        messages = buildSummaryPrompt(chunkTexts);
    }

    // 4. Generate content
    const content = await aiService.chatCompletion({ messages });

    // 5. Save to database
    const artifact = await aiArtifactRepository.upsert(documentId, command, content);

    const artifactDTO: AIArtifactDTO = {
      id: artifact.id,
      documentId: artifact.documentId,
      type: artifact.type,
      content: artifact.content,
      createdAt: artifact.createdAt.toISOString(),
      updatedAt: artifact.updatedAt.toISOString(),
    };

    return artifactDTO;
  }
}

export const commandService = new CommandService();
