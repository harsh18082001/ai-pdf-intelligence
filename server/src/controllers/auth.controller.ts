import type { Request, Response } from 'express';
import { documentRepository } from '../repositories/document.repository.js';
import { AppError } from '../middlewares/error-handler.js';
import type { ApiResponse } from '../types/index.js';

export const migrateGuestData = async (req: Request, res: Response<ApiResponse<{ migratedCount: number }>>) => {
  const { guestSessionId } = req.body;

  if (!req.owner || req.owner.type !== 'user') {
    throw new AppError('Authentication required to migrate guest data', 401);
  }

  if (!guestSessionId || typeof guestSessionId !== 'string') {
    throw new AppError('Guest session ID is required', 400);
  }

  const googleUserId = req.owner.id;
  const count = await documentRepository.migrateGuestDocuments(guestSessionId, googleUserId);

  res.status(200).json({
    success: true,
    data: { migratedCount: count },
    message: `Successfully migrated ${count} documents to your account`,
  });
};
