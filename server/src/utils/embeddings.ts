/**
 * Calculate cosine similarity between two vectors.
 * Returns a value between -1 and 1, where 1 means perfectly similar.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i]! * vecB[i]!;
    normA += vecA[i]! * vecA[i]!;
    normB += vecB[i]! * vecB[i]!;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Serialize a number array to a Buffer (Float32Array underlying)
 * For storing in Prisma Bytes field.
 */
export function serializeEmbedding(embedding: number[]): Buffer {
  const float32Array = new Float32Array(embedding);
  return Buffer.from(float32Array.buffer);
}

/**
 * Deserialize a Buffer to a number array
 */
export function deserializeEmbedding(buffer: Buffer): number[] {
  const float32Array = new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
  return Array.from(float32Array);
}

/**
 * Finds the top K most similar chunks to a given query embedding.
 */
export function findTopKChunks(
  queryEmbedding: number[],
  chunks: Array<{ id: number; text: string; embedding: Buffer | null }>,
  topK: number = 5
): Array<{ id: number; text: string; score: number }> {
  const scoredChunks = chunks
    .filter(chunk => chunk.embedding !== null)
    .map(chunk => {
      const chunkEmbedding = deserializeEmbedding(chunk.embedding!);
      const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
      return {
        id: chunk.id,
        text: chunk.text,
        score,
      };
    });

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK);
}
