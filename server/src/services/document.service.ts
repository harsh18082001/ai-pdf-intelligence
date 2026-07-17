import { documentRepository } from '../repositories/document.repository.js';
import type { UploadedFile } from 'express-fileupload';
import { messageRepository } from '../repositories/message.repository.js';
import { aiArtifactRepository } from '../repositories/ai-artifact.repository.js';
import { pineconeService } from './pinecone.service.js';
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
  async upload(file: UploadedFile): Promise<DocumentDTO> {
    const doc = await documentRepository.create({
      title: file.name,
      fileName: file.name,
      fileSize: file.size,
    });

    // Start background processing
    processDocumentAsync(doc.id, file.data);

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

  async delete(id: number): Promise<void> {
    const doc = await documentRepository.findById(id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    // Delete vectors from Pinecone
    await pineconeService.deleteByDocumentId(id);

    // Prisma's onDelete: Cascade will handle chunks, messages, and artifacts
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
