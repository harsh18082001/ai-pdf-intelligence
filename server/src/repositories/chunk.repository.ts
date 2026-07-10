import { prisma } from '../db.js';
import type { Chunk } from '@prisma/client';

export class ChunkRepository {
  async createMany(
    documentId: number,
    chunks: Array<{ chunkIndex: number; text: string; embedding?: Buffer | null; tokenCount: number }>
  ): Promise<number> {
    const result = await prisma.chunk.createMany({
      data: chunks.map((chunk) => ({
        documentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding: chunk.embedding as any || null,
        tokenCount: chunk.tokenCount,
      })),
    });
    return result.count;
  }

  async findByDocumentId(documentId: number): Promise<Chunk[]> {
    return prisma.chunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' },
    });
  }

  async findWithEmbeddings(
    documentId: number
  ): Promise<Array<{ id: number; text: string; embedding: Buffer }>> {
    const chunks = await prisma.chunk.findMany({
      where: {
        documentId,
        embedding: { not: null },
      },
      select: {
        id: true,
        text: true,
        embedding: true,
      },
    });
    return chunks as Array<{ id: number; text: string; embedding: Buffer }>;
  }

  async deleteByDocumentId(documentId: number): Promise<number> {
    const result = await prisma.chunk.deleteMany({
      where: { documentId },
    });
    return result.count;
  }
}

export const chunkRepository = new ChunkRepository();
