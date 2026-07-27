import { processingService } from '../services/processing.service.js';
import { logger } from '../utils/logger.js';

export function processDocumentAsync(
  documentId: number,
  fileBuffer: Buffer,
  ownerId?: string
): Promise<void> {
  return processingService.processDocument(documentId, fileBuffer, ownerId).catch((error) => {
    logger.error({ err: error, documentId }, 'Unhandled error in processDocumentAsync');
  });
}
