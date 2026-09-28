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

const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password is too long')
  .refine((val) => /[a-z]/.test(val) && /[A-Z]/.test(val) && /[0-9]/.test(val), {
    message: 'Password must contain uppercase, lowercase, and a number',
  });

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: passwordSchema,
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});
