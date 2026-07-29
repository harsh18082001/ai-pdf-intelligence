import { documentRepository } from '../repositories/document.repository.js';
import type { UploadedFile } from 'express-fileupload';
import { pineconeService } from './pinecone.service.js';
import { b2StorageService } from './b2-storage.service.js';
import { processDocumentAsync } from '../workers/processor.js';
import { AppError } from '../middlewares/error-handler.js';
import type { DocumentDTO, RequestOwner } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type { Document } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function toDTO(doc: Document): Promise<DocumentDTO> {
  const fileUrl = `/api/documents/${doc.id}/file`;

  return {
    id: doc.id,
    title: doc.title,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    pageCount: doc.pageCount,
    status: doc.status,
    fileUrl,
    userId: doc.userId,
    sessionId: doc.sessionId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

class DocumentService {
  async upload(file: UploadedFile, owner?: RequestOwner): Promise<DocumentDTO> {
    const formattedName = file.name.toLowerCase().startsWith('dociq_') ? file.name : `dociq_${file.name}`;

    // 1. Create document record in database
    const doc = await documentRepository.create({
      title: formattedName,
      fileName: formattedName,
      fileSize: file.size,
      owner,
    });

    // 2. Save PDF file locally on server disk
    const localFilePath = path.join(UPLOAD_DIR, `doc_${doc.id}.pdf`);
    await fs.promises.writeFile(localFilePath, file.data);

    // 3. Optional background sync to Backblaze B2 if configured
    try {
      const b2Res = await b2StorageService.uploadPdf(file.data, formattedName);
      if (b2Res.storageKey) {
        await documentRepository.updateStorageKey(doc.id, b2Res.storageKey);
      }
    } catch (err: any) {
      logger.warn({ err: err.message, docId: doc.id }, 'B2 cloud sync skipped or failed, using local disk storage');
    }

    // 4. Process document text chunks and embeddings
    const ownerId = owner?.id || 'default';
    await processDocumentAsync(doc.id, file.data, ownerId);

    // 5. Return updated document DTO
    const updatedDoc = await documentRepository.findById(doc.id, owner);
    return toDTO(updatedDoc || doc);
  }

  async list(owner?: RequestOwner): Promise<DocumentDTO[]> {
    const docs = await documentRepository.findAll(owner);
    return Promise.all(docs.map((doc) => toDTO(doc)));
  }

  async getById(id: number, owner?: RequestOwner): Promise<DocumentDTO> {
    const doc = await documentRepository.findById(id, owner);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    return toDTO(doc);
  }

  async delete(id: number, owner?: RequestOwner): Promise<void> {
    const doc = await documentRepository.findById(id, owner);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    // 1. Delete local file from server disk
    const localFilePath = path.join(UPLOAD_DIR, `doc_${doc.id}.pdf`);
    if (fs.existsSync(localFilePath)) {
      try {
        await fs.promises.unlink(localFilePath);
      } catch (err) {
        logger.warn({ err }, 'Failed to delete local PDF file');
      }
    }

    // 2. Delete PDF from Backblaze B2 if storageKey exists
    if (doc.storageKey) {
      try {
        await b2StorageService.deletePdf(doc.storageKey);
      } catch (err) {
        logger.warn({ err }, 'Failed to delete PDF from B2');
      }
    }

    // 3. Delete vectors from Pinecone (scoped by ownerId if present)
    const ownerId = owner?.id || doc.userId || doc.sessionId || undefined;
    await pineconeService.deleteByDocumentId(id, ownerId);

    // 4. Cascade delete in Prisma DB
    await documentRepository.delete(id);
  }

  async getProcessingStatus(id: number, owner?: RequestOwner): Promise<{ status: string; errorMsg?: string }> {
    const doc = await documentRepository.findById(id, owner);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    return {
      status: doc.status,
      errorMsg: doc.errorMsg || undefined,
    };
  }

  async getDownloadUrl(id: number, owner?: RequestOwner): Promise<{ url: string; fileName: string }> {
    const doc = await documentRepository.findById(id, owner);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    const url = `/api/documents/${doc.id}/file`;
    return { url, fileName: doc.fileName };
  }
}

export const documentService = new DocumentService();
