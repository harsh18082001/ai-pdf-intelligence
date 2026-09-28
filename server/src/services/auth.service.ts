import argon2 from 'argon2';
import { userRepository } from '../repositories/user.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { verificationTokenRepository } from '../repositories/verification-token.repository.js';
import { documentRepository } from '../repositories/document.repository.js';
import { emailService } from './email.service.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sha256, randomToken } from '../utils/crypto.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error-handler.js';
import { logger } from '../utils/logger.js';
import type { UserDTO } from '../types/index.js';
import type { User } from '@prisma/client';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;

function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerifiedAt !== null,
  };
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

class AuthService {
  private async issueTokens(user: User, meta: { userAgent?: string; ip?: string }): Promise<IssuedTokens> {
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const expiresAt = refreshExpiry();
    // Session id must exist before we can embed it in the refresh JWT, so create with a
    // placeholder hash first, then overwrite it with the hash of the token that names it.
    const session = await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: randomToken(),
      userAgent: meta.userAgent,
      ip: meta.ip,
      expiresAt,
    });

    const refreshToken = signRefreshToken({ sub: user.id, sid: session.id });
    await sessionRepository.setRefreshHash(session.id, sha256(refreshToken));

    return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
  }

  private async migrateGuestData(guestSessionId: string | undefined, userId: string) {
    if (!guestSessionId) return;
    const count = await documentRepository.migrateGuestDocuments(guestSessionId, userId);
    if (count > 0) {
      logger.info({ userId, count }, 'Migrated guest documents into account');
    }
  }

  async register(
    input: { email: string; password: string; name?: string },
    meta: { userAgent?: string; ip?: string; guestSessionId?: string },
  ): Promise<{ user: UserDTO; tokens: IssuedTokens }> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    await this.migrateGuestData(meta.guestSessionId, user.id);
    await this.sendVerificationEmail(user);

    const tokens = await this.issueTokens(user, meta);
    return { user: toUserDTO(user), tokens };
  }

  async login(
    input: { email: string; password: string },
    meta: { userAgent?: string; ip?: string; guestSessionId?: string },
  ): Promise<{ user: UserDTO; tokens: IssuedTokens }> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('Account temporarily locked due to repeated failed logins. Try again later.', 423);
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const lockUntil =
        attempts >= LOCKOUT_THRESHOLD ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;
      await userRepository.recordLoginFailure(user.id, lockUntil);
      throw new AppError('Invalid email or password', 401);
    }

    await userRepository.recordLoginSuccess(user.id);
    await this.migrateGuestData(meta.guestSessionId, user.id);

    const tokens = await this.issueTokens(user, meta);
    return { user: toUserDTO(user), tokens };
  }

  async refresh(
    refreshToken: string,
    meta: { userAgent?: string; ip?: string },
  ): Promise<{ user: UserDTO; tokens: IssuedTokens }> {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) throw new AppError('Invalid or expired session', 401);

    const tokenHash = sha256(refreshToken);
    const session = await sessionRepository.findByHash(tokenHash);

    if (!session || session.id !== payload.sid) {
      throw new AppError('Invalid session', 401);
    }

    if (session.revokedAt) {
      // Reuse of an already-rotated refresh token: treat as compromise and kill the whole chain.
      await sessionRepository.revokeAllForUser(session.userId);
      logger.warn({ userId: session.userId }, 'Refresh token reuse detected — all sessions revoked');
      throw new AppError('Session invalidated. Please log in again.', 401);
    }

    if (session.expiresAt < new Date()) {
      throw new AppError('Session expired. Please log in again.', 401);
    }

    const user = await userRepository.findById(session.userId);
    if (!user) throw new AppError('Invalid session', 401);

    const tokens = await this.issueTokens(user, meta);
    await sessionRepository.revoke(session.id); // rotated — old refresh token is now dead

    return { user: toUserDTO(user), tokens };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const session = await sessionRepository.findByHash(sha256(refreshToken));
    if (session) await sessionRepository.revoke(session.id);
  }

  async logoutAll(userId: string): Promise<void> {
    await sessionRepository.revokeAllForUser(userId);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = randomToken();
    await verificationTokenRepository.create({
      userId: user.id,
      tokenHash: sha256(token),
      type: 'EMAIL_VERIFY',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await emailService.sendVerificationEmail(user.email, token);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user || user.emailVerifiedAt) return; // don't leak account existence
    await verificationTokenRepository.invalidateAllForUser(user.id, 'EMAIL_VERIFY');
    await this.sendVerificationEmail(user);
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await verificationTokenRepository.findValidByHash(sha256(token), 'EMAIL_VERIFY');
    if (!record) throw new AppError('Invalid or expired verification link', 400);

    await verificationTokenRepository.markUsed(record.id);
    await userRepository.markEmailVerified(record.userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // don't leak account existence

    const token = randomToken();
    await verificationTokenRepository.invalidateAllForUser(user.id, 'PASSWORD_RESET');
    await verificationTokenRepository.create({
      userId: user.id,
      tokenHash: sha256(token),
      type: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await emailService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await verificationTokenRepository.findValidByHash(sha256(token), 'PASSWORD_RESET');
    if (!record) throw new AppError('Invalid or expired reset link', 400);

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await verificationTokenRepository.markUsed(record.id);
    await userRepository.updatePassword(record.userId, passwordHash);
    await sessionRepository.revokeAllForUser(record.userId); // password change kills all existing sessions
  }

  async me(userId: string): Promise<UserDTO> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return toUserDTO(user);
  }
}

export const authService = new AuthService();
