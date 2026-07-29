import { Request, Response } from 'express';
import { chatService } from '../services/chat.service.js';
import { AppError } from '../middlewares/error-handler.js';
import type { ApiResponse, MessageDTO } from '../types/index.js';
import { logger } from '../utils/logger.js';

function getClientId(req: Request): string | undefined {
  const headerId = req.headers['x-client-id'];
  if (typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }
  const queryId = req.query.clientId;
  if (typeof queryId === 'string' && queryId.trim().length > 0) {
    return queryId.trim();
  }
  const bodyId = req.body?.clientId;
  if (typeof bodyId === 'string' && bodyId.trim().length > 0) {
    return bodyId.trim();
  }
  return undefined;
}

export const sendMessage = async (req: Request, res: Response<ApiResponse<{ message: string }>>) => {
  const documentId = parseInt((req.params.documentId as string) || '0', 10);
  if (isNaN(documentId)) throw new AppError('Invalid document ID', 400);

  const { message } = req.body;
  const clientId = getClientId(req);
  
  const response = await chatService.sendMessage(documentId, message, clientId);

  res.status(200).json({
    success: true,
    data: { message: response },
  });
};

export const streamMessage = async (req: Request, res: Response) => {
  const documentId = parseInt((req.params.documentId as string) || '0', 10);
  if (isNaN(documentId)) {
    res.status(400).json({ success: false, error: 'Invalid document ID' });
    return;
  }

  const message = req.query.message as string;
  if (!message) {
    res.status(400).json({ success: false, error: 'Message query parameter is required' });
    return;
  }

  const clientId = getClientId(req);

  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  try {
    await chatService.streamMessage(
      documentId,
      message,
      (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      clientId
    );

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    logger.error({ err: error, documentId }, 'Error in streamMessage');
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

export const getChatHistory = async (req: Request, res: Response<ApiResponse<MessageDTO[]>>) => {
  const documentId = parseInt((req.params.documentId as string) || '0', 10);
  if (isNaN(documentId)) throw new AppError('Invalid document ID', 400);

  const history = await chatService.getHistory(documentId);

  res.status(200).json({
    success: true,
    data: history,
  });
};
