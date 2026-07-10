import fs from 'fs/promises';
import { extractText, getDocumentProxy } from 'unpdf';
import { documentRepository } from '../repositories/document.repository.js';
import { chunkRepository } from '../repositories/chunk.repository.js';
import { aiService } from '../ai/ai.service.js';
import { chunkText } from '../utils/chunker.js';
import { serializeEmbedding } from '../utils/embeddings.js';
import { logger } from '../utils/logger.js';
import { DOCUMENT_STATUS } from '../config/constants.js';

class ProcessingService {
  async processDocument(documentId: number): Promise<void> {
    try {
      // 1. Mark as processing
      await documentRepository.updateStatus(documentId, DOCUMENT_STATUS.PROCESSING);

      const doc = await documentRepository.findById(documentId);
      if (!doc) {
        throw new Error(`Document ${documentId} not found`);
      }

      logger.info({ documentId }, 'Starting document processing');

      // 2. Read file and extract text
      const buffer = await fs.readFile(doc.filePath);
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text, totalPages } = await extractText(pdf, { mergePages: true });

      // 3. OCR check
      if (!text || text.trim().length < 50) {
        const ocrMsg = 'This PDF appears to contain scanned pages. OCR support is planned for a future release.';
        await documentRepository.updateStatus(documentId, DOCUMENT_STATUS.OCR_REQUIRED, ocrMsg);
        logger.warn({ documentId }, 'Document requires OCR');
        return;
      }

      // 4. Chunk text
      const chunks = chunkText(text);
      logger.info({ documentId, chunksCount: chunks.length }, 'Text chunked');

      // 5. Generate embeddings in batches to avoid overwhelming the API
      // Wait, we can generate all at once or in batches depending on chunk count.
      // Let's pass all texts to generateEmbeddings. The provider handles it.
      const texts = chunks.map((c) => c.text);
      const embeddings = await aiService.generateEmbeddings(texts);

      // 6. Prepare chunks for DB
      const dbChunks = chunks.map((chunk, index) => ({
        chunkIndex: chunk.index,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        embedding: embeddings[index] ? serializeEmbedding(embeddings[index]!) : null,
      }));

      // 7. Save chunks
      await chunkRepository.createMany(documentId, dbChunks);

      // 8. Update document status
      await documentRepository.updateProcessingResult(documentId, {
        text,
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
