import { processingService } from '../services/processing.service.js';
import { logger } from '../utils/logger.js';

export function processDocumentAsync(documentId: number, fileBuffer: Buffer): void {
  // Fire and forget, catching errors so they don't crash the process
  processingService.processDocument(documentId, fileBuffer).catch((error) => {
    logger.error({ err: error, documentId }, 'Unhandled error in processDocumentAsync');
  });
}
