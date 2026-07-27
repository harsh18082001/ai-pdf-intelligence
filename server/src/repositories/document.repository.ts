import { prisma } from '../db.js';
import type { Document } from '@prisma/client';
import { DOCUMENT_STATUS } from '../config/constants.js';
import type { RequestOwner } from '../types/index.js';

export class DocumentRepository {
  async create(data: {
    title: string;
    fileName: string;
    fileSize: number;
    storageKey?: string;
    owner?: RequestOwner;
  }): Promise<Document> {
    return prisma.document.create({
      data: {
        title: data.title,
        fileName: data.fileName,
        fileSize: data.fileSize,
        storageKey: data.storageKey || null,
        userId: data.owner?.type === 'user' ? data.owner.id : null,
        sessionId: data.owner?.type === 'guest' ? data.owner.id : null,
        status: DOCUMENT_STATUS.PENDING,
      },
    });
  }

  async findAll(owner?: RequestOwner): Promise<Document[]> {
    if (!owner) {
      return prisma.document.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return prisma.document.findMany({
      where: owner.type === 'user' ? { userId: owner.id } : { sessionId: owner.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number, owner?: RequestOwner): Promise<Document | null> {
    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) return null;

    if (owner) {
      if (owner.type === 'user' && doc.userId !== owner.id) return null;
      if (owner.type === 'guest' && doc.sessionId !== owner.id) return null;
    }

    return doc;
  }

  async updateStorageKey(id: number, storageKey: string): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data: { storageKey },
    });
  }

  async updateStatus(id: number, status: string, errorMsg?: string): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data: {
        status,
        errorMsg: errorMsg || null,
      },
    });
  }

  async updateProcessingResult(
    id: number,
    data: { pageCount: number; status: string; errorMsg?: string }
  ): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data: {
        pageCount: data.pageCount,
        status: data.status,
        errorMsg: data.errorMsg || null,
      },
    });
  }

  async delete(id: number): Promise<Document> {
    return prisma.document.delete({
      where: { id },
    });
  }

  async migrateGuestDocuments(guestSessionId: string, userId: string): Promise<number> {
    const result = await prisma.document.updateMany({
      where: { sessionId: guestSessionId },
      data: {
        userId: userId,
        sessionId: null,
      },
    });
    return result.count;
  }
}

export const documentRepository = new DocumentRepository();
