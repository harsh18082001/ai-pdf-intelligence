import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, z } from 'zod';
import { ARTIFACT_TYPES } from '../config/constants.js';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
});

export const commandSchema = z.object({
  documentId: z.number().int().positive(),
  command: z.string().refine((val) => ARTIFACT_TYPES.includes(val), {
    message: `Command must be one of: ${ARTIFACT_TYPES.join(', ')}`,
  }),
  regenerate: z.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a numeric string'),
});
