// Storage abstraction layer
// Supports local disk (dev) and S3 (production)

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
    // Implementation will depend on storage type
    // For now, return a placeholder
    throw new Error('Storage service not yet implemented');
  }

  async getFile(fileId: string): Promise<Buffer> {
    throw new Error('Storage service not yet implemented');
  }

  async deleteFile(fileId: string): Promise<void> {
    throw new Error('Storage service not yet implemented');
  }

  async getSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    throw new Error('Storage service not yet implemented');
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
