// Storage abstraction layer
// Supports local disk (dev) and S3 (production)

import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface StorageConfig {
  type: 'local' | 's3';
  localPath?: string;
  s3Bucket?: string;
  s3Region?: string;
}

export interface StoredFile {
  id: string;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export class StorageService {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async uploadFile(
    file: File | Buffer,
    filename: string,
    mimeType: string
  ): Promise<StoredFile> {
    if (this.config.type === 'local') {
      return this.uploadFileLocal(file, filename, mimeType);
    } else {
      throw new Error('S3 storage not yet implemented');
    }
  }

  private async uploadFileLocal(
    file: File | Buffer,
    filename: string,
    mimeType: string
  ): Promise<StoredFile> {
    const fileId = randomUUID();
    const ext = path.extname(filename);
    const storedFilename = `${fileId}${ext}`;
    const uploadDir = this.config.localPath || './uploads';
    const filePath = path.join(uploadDir, storedFilename);

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Convert File to Buffer if needed
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    
    // Write file to disk
    await fs.writeFile(filePath, buffer);

    return {
      id: fileId,
      path: filePath,
      originalName: filename,
      mimeType,
      size: buffer.length,
      uploadedAt: new Date(),
    };
  }

  async getFile(fileId: string): Promise<Buffer> {
    if (this.config.type === 'local') {
      const uploadDir = this.config.localPath || './uploads';
      const files = await fs.readdir(uploadDir);
      const file = files.find(f => f.startsWith(fileId));
      if (!file) {
        throw new Error('File not found');
      }
      return fs.readFile(path.join(uploadDir, file));
    } else {
      throw new Error('S3 storage not yet implemented');
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (this.config.type === 'local') {
      const uploadDir = this.config.localPath || './uploads';
      const files = await fs.readdir(uploadDir);
      const file = files.find(f => f.startsWith(fileId));
      if (file) {
        await fs.unlink(path.join(uploadDir, file));
      }
    } else {
      throw new Error('S3 storage not yet implemented');
    }
  }

  async getSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, return a simple path (in production this would be a signed S3 URL)
    return `/api/files/${fileId}`;
  }
}

// Default storage service instance
export const storage = new StorageService({
  type: process.env.STORAGE_TYPE as 'local' | 's3' || 'local',
  localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
  s3Bucket: process.env.S3_BUCKET,
  s3Region: process.env.S3_REGION || 'eu-central-1',
});

export default storage;
