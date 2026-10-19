import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { config } from '../config/env.js';

// Ensure local uploads directory exists
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max for recordings / attachments
  }
});

export interface UploadResult {
  url: string;
  provider: 'local' | 'cloudinary' | 's3';
  filename: string;
  size: number;
}

export class StorageService {
  /**
   * Save an uploaded file or audio blob
   */
  static async saveFile(file: Express.Multer.File): Promise<UploadResult> {
    // If Cloudinary credentials are provided, we could upload to Cloudinary
    if (config.STORAGE_PROVIDER === 'cloudinary' && config.CLOUDINARY_CLOUD_NAME) {
      console.log('[Storage] Cloudinary provider configured (stubbed upload for demo/dev)');
    }

    // Default: Local disk storage served via /uploads endpoint
    const fileUrl = `/uploads/${file.filename}`;
    return {
      url: fileUrl,
      provider: 'local',
      filename: file.filename,
      size: file.size
    };
  }

  static getUploadDir(): string {
    return uploadDir;
  }
}
