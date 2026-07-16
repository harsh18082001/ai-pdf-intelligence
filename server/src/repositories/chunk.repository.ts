import { prisma } from '../db.js';
import type { Chunk } from '@prisma/client';

export class ChunkRepository {
  async createMany(
    documentId: number,
    chunks: Array<{ chunkIndex: number; text: string; tokenCount: number }>
  ): Promise<number> {
    const result = await prisma.chunk.createMany({
      data: chunks.map((chunk) => ({
        documentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
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

  async deleteByDocumentId(documentId: number): Promise<number> {
    const result = await prisma.chunk.deleteMany({
      where: { documentId },
    });
    return result.count;
  }
}

export const chunkRepository = new ChunkRepository();
