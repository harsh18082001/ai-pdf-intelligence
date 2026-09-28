import { documentRepository } from '../repositories/document.repository.js';
import type { UploadedFile } from 'express-fileupload';
import { pineconeService } from './pinecone.service.js';
import { b2StorageService } from './b2-storage.service.js';
import { processDocumentAsync } from '../workers/processor.js';
import { AppError } from '../middlewares/error-handler.js';
import type { DocumentDTO, RequestOwner } from '../types/index.js';
import { ownerNamespace } from '../utils/owner.js';
import type { Document } from '@prisma/client';

function toDTO(doc: Document): DocumentDTO {
  return {
    id: doc.id,
    title: doc.title,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    pageCount: doc.pageCount,
    status: doc.status,
    lastAccessedAt: doc.lastAccessedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

class DocumentService {
  async upload(file: UploadedFile, owner: RequestOwner): Promise<DocumentDTO> {
    const storageKey = await b2StorageService.uploadPdf(file.data, file.name);

    const doc = await documentRepository.create({
      title: file.name,
      fileName: file.name,
      fileSize: file.size,
      storageKey: storageKey || undefined,
      owner,
    });

    // Wait for processing to complete synchronously so Vercel Serverless doesn't kill it
    await processDocumentAsync(doc.id, file.data, owner);

    const updatedDoc = await documentRepository.findById(doc.id);
    return toDTO(updatedDoc || doc);
  }

  async list(owner: RequestOwner): Promise<DocumentDTO[]> {
    const docs = await documentRepository.findAll(owner);
    return docs.map(toDTO);
  }

  async listRecent(owner: RequestOwner, limit = 5): Promise<DocumentDTO[]> {
    const docs = await documentRepository.findRecent(owner, limit);
    return docs.map(toDTO);
  }

  async getById(id: number, owner: RequestOwner): Promise<DocumentDTO> {
    const doc = await documentRepository.findOwnedById(id, owner);
    if (!doc) throw new AppError('Document not found', 404);
    await documentRepository.touchAccessed(id);
    return toDTO(doc);
  }

  async getFileUrl(id: number, owner: RequestOwner): Promise<string> {
    const doc = await documentRepository.findOwnedById(id, owner);
    if (!doc) throw new AppError('Document not found', 404);
    if (!doc.storageKey) throw new AppError('Original file is not available for this document', 404);

    const url = await b2StorageService.getPresignedUrl(doc.storageKey);
    if (!url) throw new AppError('File storage is not configured', 503);
    return url;
  }

  async delete(id: number, owner: RequestOwner): Promise<void> {
    const doc = await documentRepository.findOwnedById(id, owner);
    if (!doc) throw new AppError('Document not found', 404);

    await pineconeService.deleteByDocumentId(id, ownerNamespace(owner));
    if (doc.storageKey) await b2StorageService.deletePdf(doc.storageKey);

    // Prisma's onDelete: Cascade will handle chunks, messages, and artifacts
    await documentRepository.delete(id);
  }

  async getProcessingStatus(
    id: number,
    owner: RequestOwner,
  ): Promise<{ status: string; errorMsg?: string }> {
    const doc = await documentRepository.findOwnedById(id, owner);
    if (!doc) throw new AppError('Document not found', 404);
    return {
      status: doc.status,
      errorMsg: doc.errorMsg || undefined,
    };
  }
}

export const documentService = new DocumentService();
