import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class B2StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;

  constructor() {
    this.bucketName = env.B2_BUCKET_NAME || 'Doc-IQ';

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
      logger.info('Initialized Backblaze B2 S3 Storage Client');
    } else {
      logger.warn('Backblaze B2 credentials missing in env config. B2 storage disabled.');
    }
  }

  async uploadPdf(fileBuffer: Buffer, originalFileName: string): Promise<{ storageKey: string }> {
    const fileExtension = originalFileName.endsWith('.pdf') ? '' : '.pdf';
    const cleanFileName = originalFileName.toLowerCase().startsWith('dociq_') ? originalFileName : `dociq_${originalFileName}`;
    const storageKey = `documents/${uuidv4()}_${cleanFileName}${fileExtension}`;

    if (!this.s3Client) {
      logger.warn({ storageKey }, 'B2 client not initialized, returning mock storageKey');
      return { storageKey };
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        Body: fileBuffer,
        ContentType: 'application/pdf',
      });

      await this.s3Client.send(command);
      logger.info({ storageKey, bucket: this.bucketName }, 'Successfully uploaded PDF to Backblaze B2');
      return { storageKey };
    } catch (error: any) {
      logger.error({ err: error, storageKey }, 'Failed to upload PDF to Backblaze B2');
      throw new Error(`Backblaze B2 Upload Failed: ${error.message}`);
    }
  }

  async getPresignedUrl(storageKey: string, expiresInSeconds: number = 3600): Promise<string> {
    if (!this.s3Client) {
      return '';
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      return url;
    } catch (error: any) {
      logger.error({ err: error, storageKey }, 'Failed to generate presigned URL from Backblaze B2');
      return '';
    }
  }

  async getPdfBuffer(storageKey: string): Promise<Buffer | null> {
    if (!this.s3Client) return null;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      const response = await this.s3Client.send(command);
      if (!response.Body) return null;

      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch (error: any) {
      logger.error({ err: error, storageKey }, 'Failed to get PDF buffer from Backblaze B2');
      return null;
    }
  }

  async deletePdf(storageKey: string): Promise<void> {
    if (!this.s3Client) return;

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      await this.s3Client.send(command);
      logger.info({ storageKey }, 'Successfully deleted PDF from Backblaze B2');
    } catch (error: any) {
      logger.error({ err: error, storageKey }, 'Failed to delete PDF from Backblaze B2');
    }
  }
}

export const b2StorageService = new B2StorageService();
