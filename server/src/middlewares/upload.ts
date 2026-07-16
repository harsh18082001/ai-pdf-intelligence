import fileUpload from 'express-fileupload';
import { env } from '../config/env.js';
import { AppError } from './error-handler.js';
import { SUPPORTED_MIME_TYPES } from '../config/constants.js';

export const uploadPdf = [
  fileUpload({
    limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
    abortOnLimit: true,
  }),
  (req: any, _res: any, next: any) => {
    if (!req.files || !req.files.file) {
      return next(new AppError('No file uploaded', 400));
    }
    const file = req.files.file;
    if (Array.isArray(file)) {
      return next(new AppError('Only one file is allowed', 400));
    }
    if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      return next(new AppError('Only PDF files are allowed', 400));
    }
    next();
  }
];
