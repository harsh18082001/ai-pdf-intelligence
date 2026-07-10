import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import type { ApiResponse } from '../types/index.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Not Found - ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  } else {
    // Unknown error
    logger.error(err, 'Unhandled error');
  }

  // Log non-operational errors
  if (!(err instanceof AppError) || !err.isOperational || statusCode >= 500) {
    logger.error(
      {
        err,
        req: {
          method: req.method,
          url: req.url,
          body: req.body,
          params: req.params,
        },
      },
      err.message || 'Server Error'
    );
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    details,
  });
};
