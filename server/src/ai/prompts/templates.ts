import type { ChatMessage } from '../ai.types.js';
import { MESSAGE_ROLES } from '../../config/constants.js';

export function buildQAPrompt(question: string, contextChunks: string[]): ChatMessage[] {
  const context = contextChunks.join('\n\n---\n\n');
  
  return [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: `You are an AI assistant. Answer the question based ONLY on the provided document context.

Context:
${context}`,
    },
    {
      role: MESSAGE_ROLES.USER,
      content: question,
    },
  ];
}

export function buildSummaryPrompt(chunks: string[]): ChatMessage[] {
  const context = chunks.join('\n\n---\n\n');

  return [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: `You are an AI assistant. Summarize the following document context in a few short sentences.

Document Context:
${context}`,
    },
    {
      role: MESSAGE_ROLES.USER,
      content: 'Please summarize this document.',
    },
  ];
}

export function buildKeyPointsPrompt(chunks: string[]): ChatMessage[] {
  const context = chunks.join('\n\n---\n\n');

  return [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: `You are an AI assistant. Extract the 3 most important key points from the provided document context as a short bulleted list.

Document Context:
${context}`,
    },
    {
      role: MESSAGE_ROLES.USER,
      content: 'Extract the key points from this document.',
    },
  ];
}

export function buildInsightsPrompt(chunks: string[]): ChatMessage[] {
  const context = chunks.join('\n\n---\n\n');

  return [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: `You are an AI assistant. Generate a brief analysis and insights based on this document context.

Document Context:
${context}`,
    },
    {
      role: MESSAGE_ROLES.USER,
      content: 'Generate insights and analysis for this document.',
    },
  ];
}
