import { getDocumentProxy, extractText } from 'unpdf';
import { documentRepository } from '../repositories/document.repository.js';
import { chunkRepository } from '../repositories/chunk.repository.js';
import { aiService } from '../ai/ai.service.js';
import { chunkText } from '../utils/chunker.js';
import { pineconeService } from './pinecone.service.js';
import { logger } from '../utils/logger.js';
import { DOCUMENT_STATUS } from '../config/constants.js';

class ProcessingService {
  async processDocument(documentId: number, fileBuffer: Buffer, ownerId?: string): Promise<void> {
    try {
      await documentRepository.updateStatus(documentId, DOCUMENT_STATUS.PROCESSING);

      const doc = await documentRepository.findById(documentId);
      if (!doc) {
        throw new Error(`Document ${documentId} not found`);
      }

      logger.info({ documentId, ownerId }, 'Starting document processing');

      const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
      const { text, totalPages } = await extractText(pdf, { mergePages: true });

      if (!text || text.trim().length < 50) {
        const ocrMsg = 'This PDF appears to contain scanned pages. OCR support is planned for a future release.';
        await documentRepository.updateStatus(documentId, DOCUMENT_STATUS.OCR_REQUIRED, ocrMsg);
        logger.warn({ documentId }, 'Document requires OCR');
        return;
      }

      const chunks = chunkText(text);
      logger.info({ documentId, chunksCount: chunks.length }, 'Text chunked');

      const texts = chunks.map((c) => c.text);
      const embeddings = await aiService.generateEmbeddings(texts);

      const dbChunks = chunks.map((chunk) => ({
        chunkIndex: chunk.index,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
      }));

      await chunkRepository.createMany(documentId, dbChunks);

      const pineconeChunks = chunks.map((chunk, index) => ({
        chunkIndex: chunk.index,
        text: chunk.text,
        embedding: embeddings[index]!,
      }));
      await pineconeService.upsertChunks(documentId, pineconeChunks, ownerId);

      await documentRepository.updateProcessingResult(documentId, {
        pageCount: totalPages,
        status: DOCUMENT_STATUS.COMPLETED,
      });

      logger.info({ documentId }, 'Document processing completed successfully');
    } catch (error: any) {
      logger.error({ err: error, documentId }, 'Document processing failed');
      await documentRepository.updateStatus(
        documentId,
        DOCUMENT_STATUS.FAILED,
        error.message || 'Unknown processing error'
      );
    }
  }
}

export const processingService = new ProcessingService();
