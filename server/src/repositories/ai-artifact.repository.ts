import { prisma } from '../db.js';
import type { AIArtifact } from '@prisma/client';

export class AIArtifactRepository {
  async findByDocumentAndType(documentId: number, type: string): Promise<AIArtifact | null> {
    return prisma.aIArtifact.findFirst({
      where: {
        documentId,
        type,
      },
    });
  }

  async upsert(documentId: number, type: string, content: string): Promise<AIArtifact> {
    const existing = await this.findByDocumentAndType(documentId, type);

    if (existing) {
      return prisma.aIArtifact.update({
        where: { id: existing.id },
        data: { content },
      });
    }

    return prisma.aIArtifact.create({
      data: {
        documentId,
        type,
        content,
      },
    });
  }

  async deleteByDocumentId(documentId: number): Promise<number> {
    const result = await prisma.aIArtifact.deleteMany({
      where: { documentId },
    });
    return result.count;
  }

  async deleteByDocumentAndType(documentId: number, type: string): Promise<number> {
    const result = await prisma.aIArtifact.deleteMany({
      where: { documentId, type },
    });
    return result.count;
  }
}

export const aiArtifactRepository = new AIArtifactRepository();
