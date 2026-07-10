import { prisma } from '../db.js';
import type { Message } from '@prisma/client';

export class MessageRepository {
  async create(data: { documentId: number; role: string; content: string }): Promise<Message> {
    return prisma.message.create({
      data: {
        documentId: data.documentId,
        role: data.role,
        content: data.content,
      },
    });
  }

  async findByDocumentId(documentId: number): Promise<Message[]> {
    return prisma.message.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteByDocumentId(documentId: number): Promise<number> {
    const result = await prisma.message.deleteMany({
      where: { documentId },
    });
    return result.count;
  }
}

export const messageRepository = new MessageRepository();
