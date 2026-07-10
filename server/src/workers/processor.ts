import { processingService } from '../services/processing.service.js';
import { logger } from '../utils/logger.js';

export function processDocumentAsync(documentId: number): void {
  // Fire and forget, catching errors so they don't crash the process
  processingService.processDocument(documentId).catch((error) => {
    logger.error({ err: error, documentId }, 'Unhandled error in processDocumentAsync');
  });
}
