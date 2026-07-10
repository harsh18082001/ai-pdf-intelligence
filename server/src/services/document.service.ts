import fs from 'fs/promises';
import { documentRepository } from '../repositories/document.repository.js';
import { chunkRepository } from '../repositories/chunk.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import { aiArtifactRepository } from '../repositories/ai-artifact.repository.js';
import { processDocumentAsync } from '../workers/processor.js';
import { AppError } from '../middlewares/error-handler.js';
import type { DocumentDTO } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { Document } from '@prisma/client';

function toDTO(doc: Document): DocumentDTO {
  return {
    id: doc.id,
    title: doc.title,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    pageCount: doc.pageCount,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

class DocumentService {
  async upload(file: Express.Multer.File): Promise<DocumentDTO> {
    const doc = await documentRepository.create({
      title: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
    });

    // Start background processing
    processDocumentAsync(doc.id);

    return toDTO(doc);
  }

  async list(): Promise<DocumentDTO[]> {
    const docs = await documentRepository.findAll();
    return docs.map(toDTO);
  }

  async getById(id: number): Promise<DocumentDTO> {
    const doc = await documentRepository.findById(id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    return toDTO(doc);
  }

  async getFilePath(id: number): Promise<string> {
    const doc = await documentRepository.findById(id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    return doc.filePath;
  }

  async delete(id: number): Promise<void> {
    const doc = await documentRepository.findById(id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    try {
      await fs.unlink(doc.filePath);
    } catch (error) {
      logger.warn({ err: error, filePath: doc.filePath }, 'Failed to delete file from disk');
    }

    // Prisma's onDelete: Cascade will handle chunks, messages, and artifacts,
    // but just in case, we can rely on Prisma.
    await documentRepository.delete(id);
  }

  async getProcessingStatus(id: number): Promise<{ status: string; errorMsg?: string }> {
    const doc = await documentRepository.findById(id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    return {
      status: doc.status,
      errorMsg: doc.errorMsg || undefined,
    };
  }
}

export const documentService = new DocumentService();
