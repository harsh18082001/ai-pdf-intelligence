import { prisma } from '../db.js';
import type { VerificationToken, VerificationTokenType } from '@prisma/client';

export class VerificationTokenRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    type: VerificationTokenType;
    expiresAt: Date;
  }): Promise<VerificationToken> {
    return prisma.verificationToken.create({ data });
  }

  async findValidByHash(
    tokenHash: string,
    type: VerificationTokenType,
  ): Promise<VerificationToken | null> {
    return prisma.verificationToken.findFirst({
      where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async markUsed(id: string): Promise<VerificationToken> {
    return prisma.verificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async invalidateAllForUser(userId: string, type: VerificationTokenType): Promise<void> {
    await prisma.verificationToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}

export const verificationTokenRepository = new VerificationTokenRepository();
