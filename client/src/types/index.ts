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
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export interface AIArtifactDTO {
  id: number;
  documentId: number;
  type: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
