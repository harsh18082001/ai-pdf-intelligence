import type { ChatMessage } from '../ai.types.js';
import { MESSAGE_ROLES } from '../../config/constants.js';

export function buildQAPrompt(question: string, contextChunks: string[]): ChatMessage[] {
  const context = contextChunks.join('\n\n---\n\n');
  
  return [
    {
      role: MESSAGE_ROLES.SYSTEM,
      content: `You are a helpful AI assistant. Answer the user's question based ONLY on the provided document context below. 
If the context does not contain the information needed to answer the question, clearly state "I don't have enough information in the document to answer that."
Do NOT make up information. Use Markdown formatting where appropriate (e.g., bullet points, bold text).

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
      content: `You are an expert summarizer. Provide a comprehensive summary of the following document context.
Your summary should capture the main topics, purpose, and key takeaways of the document.
Format the output in clear Markdown with appropriate headings and paragraphs.

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
      content: `You are an analytical assistant. Extract the most important key points from the provided document context.
Present the key points as a structured, easy-to-read Markdown list. Keep each point concise but informative.

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
      content: `You are an expert analyst. Read the provided document context and generate deep insights and analysis.
Go beyond just summarizing: identify trends, significant conclusions, potential implications, or hidden patterns within the text.
Format your analysis in Markdown using headings and bullet points.

Document Context:
${context}`,
    },
    {
      role: MESSAGE_ROLES.USER,
      content: 'Generate insights and analysis for this document.',
    },
  ];
}
