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
  async upload(file: UploadedFile, clientId?: string): Promise<DocumentDTO> {
    const doc = await documentRepository.create({
      title: file.name,
      fileName: file.name,
      fileSize: file.size,
      clientId: clientId,
    });

    // Wait for processing to complete synchronously so Vercel Serverless doesn't kill it
    await processDocumentAsync(doc.id, file.data, clientId);

    // Fetch the updated document with its new status
    const updatedDoc = await documentRepository.findById(doc.id);
    return toDTO(updatedDoc || doc);
  }

  async list(clientId?: string): Promise<DocumentDTO[]> {
    const docs = await documentRepository.findAll(clientId);
    return docs.map(toDTO);
  }

  async getById(id: number, clientId?: string): Promise<DocumentDTO> {
    const doc = await documentRepository.findById(id);
    if (!doc || (clientId && doc.clientId !== clientId)) {
      throw new AppError('Document not found', 404);
    }
    return toDTO(doc);
  }

  async delete(id: number, clientId?: string): Promise<void> {
    const doc = await documentRepository.findById(id);
    if (!doc || (clientId && doc.clientId !== clientId)) {
      throw new AppError('Document not found', 404);
    }

    // Delete vectors from Pinecone
    await pineconeService.deleteByDocumentId(id, clientId);

    // Prisma's onDelete: Cascade will handle chunks, messages, and artifacts
    await documentRepository.delete(id);
  }

  async getProcessingStatus(id: number, clientId?: string): Promise<{ status: string; errorMsg?: string }> {
    const doc = await documentRepository.findById(id);
    if (!doc || (clientId && doc.clientId !== clientId)) {
      throw new AppError('Document not found', 404);
    }
    return {
      status: doc.status,
      errorMsg: doc.errorMsg || undefined,
    };
  }
}

export const documentService = new DocumentService();
