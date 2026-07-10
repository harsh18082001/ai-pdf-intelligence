import { Request, Response } from 'express';
import { commandService } from '../services/command.service.js';
import type { ApiResponse, AIArtifactDTO } from '../types/index.js';

export const executeCommand = async (req: Request, res: Response<ApiResponse<AIArtifactDTO>>) => {
  const { documentId, command, regenerate } = req.body;

  const result = await commandService.execute(documentId, command, regenerate);

  res.status(200).json({
    success: true,
    data: result,
  });
};
