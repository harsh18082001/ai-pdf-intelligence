import { Request, Response } from 'express';
import { commandService } from '../services/command.service.js';
import { AppError } from '../middlewares/error-handler.js';
import type { ApiResponse, AIArtifactDTO } from '../types/index.js';

export const executeCommand = async (req: Request, res: Response<ApiResponse<AIArtifactDTO>>) => {
  const { documentId, command, regenerate } = req.body;
  if (!req.owner) throw new AppError('Unable to identify request', 401);

  const result = await commandService.execute(documentId, command, req.owner, regenerate);

  res.status(200).json({
    success: true,
    data: result,
  });
};
