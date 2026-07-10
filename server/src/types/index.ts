export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface DocumentDTO {
  id: number;
  title: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDTO {
  id: number;
  documentId: number;
  role: string;
  content: string;
  createdAt: string;
}

export interface ChunkDTO {
  id: number;
  documentId: number;
  chunkIndex: number;
  text: string;
  tokenCount: number;
}

export interface AIArtifactDTO {
  id: number;
  documentId: number;
  type: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommandRequest {
  documentId: number;
  command: string;
  regenerate?: boolean;
}

export interface ChatRequest {
  message: string;
}

export type StreamCallback = (chunk: string) => void;
