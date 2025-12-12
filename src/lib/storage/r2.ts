import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'clipforge';

export interface UploadUrlOptions {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default 1 hour
}

export interface DownloadUrlOptions {
  key: string;
  expiresIn?: number; // seconds, default 1 hour
}

/**
 * Generate a pre-signed URL for uploading files directly to R2
 */
export async function getUploadUrl({ key, contentType, expiresIn = 3600 }: UploadUrlOptions): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a pre-signed URL for downloading files from R2
 */
export async function getDownloadUrl({ key, expiresIn = 3600 }: DownloadUrlOptions): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Get public URL for a file (if bucket has public access enabled)
 */
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error('R2 public URL not configured');
  }
  return `${publicUrl}/${key}`;
}

/**
 * Generate a unique storage key for uploaded files
 */
export function generateStorageKey(userId: string, type: 'video' | 'audio' | 'image' | 'clip', filename: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 10);
  const extension = filename.split('.').pop() || '';
  return `${type}s/${userId}/${timestamp}-${randomId}.${extension}`;
}

/**
 * Generate a unique storage key for thumbnails
 */
export function generateThumbnailKey(userId: string, contentId: string): string {
  return `thumbnails/${userId}/${contentId}.jpg`;
}

/**
 * Supported video types
 */
export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
];

/**
 * Supported audio types
 */
export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', // .mp3
  'audio/wav',
  'audio/mp4', // .m4a
  'audio/ogg',
  'audio/webm',
];

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  free: 100 * 1024 * 1024, // 100 MB
  starter: 500 * 1024 * 1024, // 500 MB
  pro: 2 * 1024 * 1024 * 1024, // 2 GB
  agency: 5 * 1024 * 1024 * 1024, // 5 GB
};

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
  return [...SUPPORTED_VIDEO_TYPES, ...SUPPORTED_AUDIO_TYPES].includes(mimeType);
}

/**
 * Get file type category
 */
export function getFileCategory(mimeType: string): 'video' | 'audio' | null {
  if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) return 'video';
  if (SUPPORTED_AUDIO_TYPES.includes(mimeType)) return 'audio';
  return null;
}


