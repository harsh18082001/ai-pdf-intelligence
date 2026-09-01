import { prisma } from '../db.js';
import type { User } from '@prisma/client';

export class UserRepository {
  async create(data: { email: string; passwordHash: string; name?: string }): Promise<User> {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async markEmailVerified(id: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  async recordLoginSuccess(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
  }

  async recordLoginFailure(id: string, lockUntil: Date | null): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: { increment: 1 },
        lockedUntil: lockUntil,
      },
    });
  }
}

export const userRepository = new UserRepository();
