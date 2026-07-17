export const CHUNK_SIZE = 512;
export const CHUNK_OVERLAP = 50;
export const EMBEDDING_DIMENSION = 384;
export const TOP_K_CHUNKS = 2;
export const MAX_CONTEXT_TOKENS = 1024;
export const SUPPORTED_MIME_TYPES = ['application/pdf'];

export enum DOCUMENT_STATUS {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  OCR_REQUIRED = 'ocr_required',
}

export const ARTIFACT_TYPES = [
  'summary',
  'key_points',
  'insights',
  'flashcards',
  'quiz',
  'interview_questions',
  'resume_analysis',
];

export enum MESSAGE_ROLES {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}
