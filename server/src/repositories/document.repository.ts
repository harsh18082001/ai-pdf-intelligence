import { prisma } from '../db.js';
import type { Document } from '@prisma/client';
import { DOCUMENT_STATUS } from '../config/constants.js';
import type { RequestOwner } from '../types/index.js';

function ownerWhere(owner: RequestOwner) {
  return owner.type === 'user' ? { userId: owner.id } : { guestSessionId: owner.id };
}

export class DocumentRepository {
  async create(data: {
    title: string;
    fileName: string;
    fileSize: number;
    storageKey?: string;
    owner: RequestOwner;
  }): Promise<Document> {
    return prisma.document.create({
      data: {
        title: data.title,
        fileName: data.fileName,
        fileSize: data.fileSize,
        storageKey: data.storageKey || null,
        userId: data.owner.type === 'user' ? data.owner.id : null,
        guestSessionId: data.owner.type === 'guest' ? data.owner.id : null,
        status: DOCUMENT_STATUS.PENDING,
      },
    });
  }

  async findAll(owner: RequestOwner): Promise<Document[]> {
    return prisma.document.findMany({
      where: ownerWhere(owner),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecent(owner: RequestOwner, limit = 5): Promise<Document[]> {
    return prisma.document.findMany({
      where: ownerWhere(owner),
      orderBy: { lastAccessedAt: 'desc' },
      take: limit,
    });
  }

  async findById(id: number): Promise<Document | null> {
    return prisma.document.findUnique({ where: { id } });
  }

  /** Returns the document only if it belongs to `owner`, otherwise null (used for ownership checks). */
  async findOwnedById(id: number, owner: RequestOwner): Promise<Document | null> {
    const doc = await this.findById(id);
    if (!doc) return null;
    if (owner.type === 'user' && doc.userId !== owner.id) return null;
    if (owner.type === 'guest' && doc.guestSessionId !== owner.id) return null;
    return doc;
  }

  async touchAccessed(id: number): Promise<void> {
    await prisma.document.update({ where: { id }, data: { lastAccessedAt: new Date() } });
  }

  async updateStorageKey(id: number, storageKey: string): Promise<Document> {
    return prisma.document.update({ where: { id }, data: { storageKey } });
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
    data: { pageCount: number; status: string; errorMsg?: string },
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

  /** Reassigns every guest document to `userId` on login/register — the "guest data merges in" step. */
  async migrateGuestDocuments(guestSessionId: string, userId: string): Promise<number> {
    const result = await prisma.document.updateMany({
      where: { guestSessionId },
      data: { userId, guestSessionId: null },
    });
    return result.count;
  }
}

export const documentRepository = new DocumentRepository();
