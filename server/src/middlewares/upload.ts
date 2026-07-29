import { AppError } from './error-handler.js';
import { SUPPORTED_MIME_TYPES } from '../config/constants.js';
import type { Request, Response, NextFunction } from 'express';

export const uploadPdf = (req: Request, _res: Response, next: NextFunction) => {
  const files = (req as any).files;
  if (!files || !files.file) {
    return next(new AppError('No file uploaded', 400));
  }
  const file = files.file;
  if (Array.isArray(file)) {
    return next(new AppError('Only one file is allowed', 400));
  }
  if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
    return next(new AppError('Only PDF files are allowed', 400));
  }
  next();
};
