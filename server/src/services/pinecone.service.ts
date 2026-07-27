import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

class PineconeService {
  private pinecone: Pinecone;
  private index: ReturnType<Pinecone['index']>;

  constructor() {
    this.pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY });
    this.index = this.pinecone.index('dociq');
  }

  private getTargetIndex(ownerId?: string) {
    if (ownerId && ownerId.trim().length > 0) {
      return this.index.namespace(ownerId);
    }
    return this.index;
  }

  async upsertChunks(
    documentId: number,
    chunks: Array<{ chunkIndex: number; text: string; embedding: number[] }>,
    ownerId?: string
  ): Promise<void> {
    logger.info({ documentId, chunkCount: chunks.length, ownerId }, 'Upserting chunks to Pinecone');

    const records = chunks.map((chunk) => ({
      id: `doc_${documentId}_chunk_${chunk.chunkIndex}`,
      values: chunk.embedding,
      metadata: {
        documentId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
      },
    }));

    const target = this.getTargetIndex(ownerId);
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await target.upsert({ records: batch });
    }

    logger.info({ documentId }, 'Successfully upserted chunks to Pinecone');
  }

  async querySimilar(
    documentId: number,
    queryVector: number[],
    topK: number = 5,
    ownerId?: string
  ): Promise<Array<{ text: string; score: number }>> {
    const target = this.getTargetIndex(ownerId);
    const response = await target.query({
      vector: queryVector,
      topK,
      filter: {
        documentId: { $eq: documentId },
      },
      includeMetadata: true,
    });

    return response.matches.map((match) => ({
      text: (match.metadata?.text as string) || '',
      score: match.score || 0,
    }));
  }

  async deleteByDocumentId(documentId: number, ownerId?: string): Promise<void> {
    try {
      logger.info({ documentId, ownerId }, 'Deleting document chunks from Pinecone');
      const target = this.getTargetIndex(ownerId);

      const stats = await this.index.describeIndexStats();
      const dimension = stats.dimension || 768;

      const queryResponse = await target.query({
        vector: Array(dimension).fill(0),
        topK: 10000,
        filter: { documentId: { $eq: documentId } },
        includeMetadata: false,
      });

      const idsToDelete = queryResponse.matches.map((m) => m.id);

      if (idsToDelete.length > 0) {
        await target.deleteMany({ ids: idsToDelete });
      }

      logger.info({ documentId, deletedCount: idsToDelete.length }, 'Successfully deleted document from Pinecone');
    } catch (error) {
      logger.warn({ err: error, documentId }, 'Failed to delete chunks from Pinecone. They may need manual cleanup.');
    }
  }
}

export const pineconeService = new PineconeService();
