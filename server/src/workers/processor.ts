import { processingService } from '../services/processing.service.js';
import { logger } from '../utils/logger.js';

export function processDocumentAsync(documentId: number, fileBuffer: Buffer): Promise<void> {
  // Return the promise so it can be awaited for Vercel serverless compatibility
  return processingService.processDocument(documentId, fileBuffer).catch((error) => {
    logger.error({ err: error, documentId }, 'Unhandled error in processDocumentAsync');
  });
}
