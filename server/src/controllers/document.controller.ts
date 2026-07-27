import type { Request, Response } from 'express';
import type { UploadedFile } from 'express-fileupload';
import { documentService } from '../services/document.service.js';
import { AppError } from '../middlewares/error-handler.js';
import type { ApiResponse, DocumentDTO } from '../types/index.js';

export const uploadDocument = async (req: Request, res: Response<ApiResponse<DocumentDTO>>) => {
  if (!req.files || !req.files.file) {
    throw new AppError('No file uploaded', 400);
  }

  const file = req.files.file as UploadedFile;
  const document = await documentService.upload(file, req.owner);

  res.status(201).json({
    success: true,
    data: document,
  });
};

export const listDocuments = async (req: Request, res: Response<ApiResponse<DocumentDTO[]>>) => {
  const documents = await documentService.list(req.owner);

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).json({
    success: true,
    data: documents,
  });
};

export const getDocument = async (req: Request, res: Response<ApiResponse<DocumentDTO>>) => {
  const id = parseInt((req.params.id as string) || '0', 10);
  if (isNaN(id)) throw new AppError('Invalid document ID', 400);

  const document = await documentService.getById(id, req.owner);

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).json({
    success: true,
    data: document,
  });
};

export const downloadDocument = async (req: Request, res: Response<ApiResponse<{ url: string; fileName: string }>>) => {
  const id = parseInt((req.params.id as string) || '0', 10);
  if (isNaN(id)) throw new AppError('Invalid document ID', 400);

  const result = await documentService.getDownloadUrl(id, req.owner);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const deleteDocument = async (req: Request, res: Response<ApiResponse>) => {
  const id = parseInt((req.params.id as string) || '0', 10);
  if (isNaN(id)) throw new AppError('Invalid document ID', 400);

  await documentService.delete(id, req.owner);

  res.status(204).send();
};
