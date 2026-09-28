import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class B2StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;

  constructor() {
    this.bucketName = env.B2_BUCKET_NAME || 'dociq-documents';

    if (env.B2_KEY_ID && env.B2_APPLICATION_KEY && env.B2_ENDPOINT) {
      const endpointUrl = env.B2_ENDPOINT.startsWith('http')
        ? env.B2_ENDPOINT
        : `https://${env.B2_ENDPOINT}`;

      this.s3Client = new S3Client({
        endpoint: endpointUrl,
        region: env.B2_REGION || 'eu-central-003',
        credentials: {
          accessKeyId: env.B2_KEY_ID,
          secretAccessKey: env.B2_APPLICATION_KEY,
        },
      });
      logger.info('Initialized Backblaze B2 S3 storage client');
    } else {
      logger.warn('Backblaze B2 credentials missing — original PDFs will not be persisted');
    }
  }

  get isEnabled(): boolean {
    return this.s3Client !== null;
  }

  async uploadPdf(fileBuffer: Buffer, originalFileName: string): Promise<string | null> {
    if (!this.s3Client) return null;

    const storageKey = `documents/${uuidv4()}_${originalFileName}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: storageKey,
          Body: fileBuffer,
          ContentType: 'application/pdf',
        }),
      );
      logger.info({ storageKey }, 'Uploaded PDF to Backblaze B2');
      return storageKey;
    } catch (error) {
      logger.error({ err: error, storageKey }, 'Failed to upload PDF to Backblaze B2');
      return null;
    }
  }

  /** Short-lived signed URL — never store this, generate on demand for each download request. */
  async getPresignedUrl(storageKey: string, expiresInSeconds = 300): Promise<string | null> {
    if (!this.s3Client) return null;

    try {
      const command = new GetObjectCommand({ Bucket: this.bucketName, Key: storageKey });
      return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      logger.error({ err: error, storageKey }, 'Failed to generate presigned URL from Backblaze B2');
      return null;
    }
  }

  async deletePdf(storageKey: string): Promise<void> {
    if (!this.s3Client) return;

    try {
      await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: storageKey }));
      logger.info({ storageKey }, 'Deleted PDF from Backblaze B2');
    } catch (error) {
      logger.error({ err: error, storageKey }, 'Failed to delete PDF from Backblaze B2');
    }
  }
}

export const b2StorageService = new B2StorageService();
