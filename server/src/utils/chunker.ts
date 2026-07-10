import { CHUNK_SIZE, CHUNK_OVERLAP } from '../config/constants.js';

export interface ChunkResult {
  text: string;
  tokenCount: number;
  index: number;
}

/**
 * Approximate token count by word count
 * (Average English text is about 1.3 tokens per word)
 */
export function estimateTokenCount(text: string): number {
  const words = text.trim().split(/\s+/);
  return Math.ceil(words.length * 1.3);
}

/**
 * Splits text into chunks with a maximum token size and an overlap.
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): ChunkResult[] {
  if (!text) return [];

  // Split by paragraphs to try and maintain natural boundaries
  const paragraphs = text.split(/\n\s*\n/);
  
  const chunks: ChunkResult[] = [];
  let currentChunk = '';
  let currentTokens = 0;
  let index = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i]!.trim();
    if (!paragraph) continue;

    const paragraphTokens = estimateTokenCount(paragraph);

    // If a single paragraph is too large, we need to split it by sentences
    if (paragraphTokens > chunkSize) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      for (const sentence of sentences) {
        const sentenceStr = sentence.trim();
        const sentenceTokens = estimateTokenCount(sentenceStr);

        if (currentTokens + sentenceTokens > chunkSize && currentTokens > 0) {
          chunks.push({
            text: currentChunk.trim(),
            tokenCount: currentTokens,
            index: index++,
          });
          
          // Start new chunk with overlap if possible
          // A simplified approach for overlap: just keep the last sentence
          currentChunk = sentenceStr;
          currentTokens = sentenceTokens;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentenceStr;
          currentTokens += sentenceTokens;
        }
      }
      continue;
    }

    if (currentTokens + paragraphTokens > chunkSize && currentTokens > 0) {
      chunks.push({
        text: currentChunk.trim(),
        tokenCount: currentTokens,
        index: index++,
      });
      // Start new chunk
      // For overlap between paragraphs, we could include the last paragraph of the previous chunk
      currentChunk = paragraphs[i - 1] ? paragraphs[i - 1]! + '\n\n' + paragraph : paragraph;
      currentTokens = estimateTokenCount(currentChunk);
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentTokens += paragraphTokens;
    }
  }

  if (currentTokens > 0) {
    chunks.push({
      text: currentChunk.trim(),
      tokenCount: currentTokens,
      index: index++,
    });
  }

  return chunks;
}
