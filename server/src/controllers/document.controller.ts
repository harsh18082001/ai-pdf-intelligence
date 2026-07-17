import { Request, Response } from 'express';
import type { UploadedFile } from 'express-fileupload';
import { documentService } from '../services/document.service.js';
import { AppError } from '../middlewares/error-handler.js';
import type { ApiResponse, DocumentDTO } from '../types/index.js';

export const uploadDocument = async (req: Request, res: Response<ApiResponse<DocumentDTO>>) => {
  if (!req.files || !req.files.file) {
    throw new AppError('No file uploaded', 400);
  }

  const file = req.files.file as UploadedFile;
  console.log('UPLOADED FILE:', file);
  const document = await documentService.upload(file);

  res.status(201).json({
    success: true,
    data: document,
  });
};

export const listDocuments = async (_req: Request, res: Response<ApiResponse<DocumentDTO[]>>) => {
  const documents = await documentService.list();

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).json({
    success: true,
    data: documents,
  });
};

export const getDocument = async (req: Request, res: Response<ApiResponse<DocumentDTO>>) => {
  const id = parseInt((req.params.id as string) || '0', 10);
  if (isNaN(id)) throw new AppError('Invalid document ID', 400);

  const document = await documentService.getById(id);

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
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
