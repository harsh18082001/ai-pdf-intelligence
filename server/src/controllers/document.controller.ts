import { Request, Response } from 'express';
import { documentService } from '../services/document.service.js';
import { AppError } from '../middlewares/error-handler.js';
import type { ApiResponse, DocumentDTO } from '../types/index.js';

export const uploadDocument = async (req: Request, res: Response<ApiResponse<DocumentDTO>>) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const document = await documentService.upload(req.file);

  res.status(201).json({
    success: true,
    data: document,
  });
};

export const listDocuments = async (_req: Request, res: Response<ApiResponse<DocumentDTO[]>>) => {
  const documents = await documentService.list();

  res.status(200).json({
    success: true,
    data: documents,
  });
};

export const getDocument = async (req: Request, res: Response<ApiResponse<DocumentDTO>>) => {
  const id = parseInt((req.params.id as string) || '0', 10);
  if (isNaN(id)) throw new AppError('Invalid document ID', 400);

  const document = await documentService.getById(id);

  res.status(200).json({
    success: true,
    data: document,
  });
};

export const deleteDocument = async (req: Request, res: Response<ApiResponse>) => {
  const id = parseInt((req.params.id as string) || '0', 10);
  if (isNaN(id)) throw new AppError('Invalid document ID', 400);

  await documentService.delete(id);

  res.status(204).send();
};

export const getDocumentStatus = async (
  req: Request,
  res: Response<ApiResponse<{ status: string; errorMsg?: string }>>
) => {
  const id = parseInt((req.params.id as string) || '0', 10);
  if (isNaN(id)) throw new AppError('Invalid document ID', 400);

  const status = await documentService.getProcessingStatus(id);

  res.status(200).json({
    success: true,
    data: status,
  });
};

import path from 'path';

export const downloadDocument = async (req: Request, res: Response) => {
  const id = parseInt((req.params.id as string) || '0', 10);
  if (isNaN(id)) throw new AppError('Invalid document ID', 400);

  const filePath = await documentService.getFilePath(id);
  res.sendFile(path.resolve(filePath));
};
