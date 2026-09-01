import { prisma } from '../db.js';
import type { Session } from '@prisma/client';

export class SessionRepository {
  async create(data: {
    userId: string;
    refreshTokenHash: string;
    userAgent?: string;
    ip?: string;
    expiresAt: Date;
  }): Promise<Session> {
    return prisma.session.create({ data });
  }

  async findByHash(refreshTokenHash: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { refreshTokenHash } });
  }

  async findById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { id } });
  }

  async setRefreshHash(id: string, refreshTokenHash: string): Promise<Session> {
    return prisma.session.update({ where: { id }, data: { refreshTokenHash } });
  }

  async revoke(id: string, replacedBySessionId?: string): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data: { revokedAt: new Date(), replacedBySessionId: replacedBySessionId || null },
    });
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }
}

export const sessionRepository = new SessionRepository();
