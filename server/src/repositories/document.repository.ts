import { prisma } from '../db.js';
import type { Document } from '@prisma/client';
import { DOCUMENT_STATUS } from '../config/constants.js';

export class DocumentRepository {
  async create(data: {
    title: string;
    fileName: string;
    filePath: string;
    fileSize: number;
  }): Promise<Document> {
    return prisma.document.create({
      data: {
        ...data,
        status: DOCUMENT_STATUS.PENDING,
      },
    });
  }

  async findAll(): Promise<Document[]> {
    return prisma.document.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: number): Promise<Document | null> {
    return prisma.document.findUnique({
      where: { id },
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
    data: { text: string; pageCount: number; status: string; errorMsg?: string }
  ): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data: {
        text: data.text,
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
}

export const documentRepository = new DocumentRepository();
