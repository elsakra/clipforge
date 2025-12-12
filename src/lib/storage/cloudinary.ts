import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes: number;
}

/**
 * Upload a video to Cloudinary
 */
export async function uploadVideo(
  file: string | Buffer,
  options?: {
    folder?: string;
    publicId?: string;
    resourceType?: 'video' | 'raw';
  }
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:video/mp4;base64,${file.toString('base64')}`,
    {
      resource_type: options?.resourceType || 'video',
      folder: options?.folder || 'clipforge/videos',
      public_id: options?.publicId,
      overwrite: true,
    }
  );

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    format: result.format,
    duration: result.duration,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

/**
 * Upload audio to Cloudinary
 */
export async function uploadAudio(
  file: string | Buffer,
  options?: {
    folder?: string;
    publicId?: string;
  }
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:audio/mp3;base64,${file.toString('base64')}`,
    {
      resource_type: 'video', // Cloudinary treats audio as video
      folder: options?.folder || 'clipforge/audio',
      public_id: options?.publicId,
      overwrite: true,
    }
  );

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    format: result.format,
    duration: result.duration,
    bytes: result.bytes,
  };
}

/**
 * Upload an image (thumbnail) to Cloudinary
 */
export async function uploadImage(
  file: string | Buffer,
  options?: {
    folder?: string;
    publicId?: string;
  }
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
    {
      resource_type: 'image',
      folder: options?.folder || 'clipforge/thumbnails',
      public_id: options?.publicId,
      overwrite: true,
    }
  );

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

/**
 * Generate a signed upload URL for client-side uploads
 */
export function generateUploadSignature(
  folder: string,
  resourceType: 'video' | 'image' | 'raw' = 'video'
): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
} {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFile(
  publicId: string,
  resourceType: 'video' | 'image' | 'raw' = 'video'
): Promise<boolean> {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
  return result.result === 'ok';
}

/**
 * Get video/audio details from Cloudinary
 */
export async function getMediaDetails(
  publicId: string,
  resourceType: 'video' | 'image' = 'video'
): Promise<{
  duration?: number;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  url: string;
}> {
  const result = await cloudinary.api.resource(publicId, {
    resource_type: resourceType,
  });

  return {
    duration: result.duration,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    url: result.secure_url,
  };
}

/**
 * Generate a URL for a video clip with transformations
 */
export function getClipUrl(
  publicId: string,
  startOffset: number,
  endOffset: number,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'pad';
    aspectRatio?: string;
  }
): string {
  const transformations: string[] = [];

  // Add time-based clipping
  transformations.push(`so_${startOffset},eo_${endOffset}`);

  // Add dimension transformations
  if (options?.width || options?.height) {
    let dimTransform = '';
    if (options.width) dimTransform += `w_${options.width}`;
    if (options.height) dimTransform += `,h_${options.height}`;
    if (options.crop) dimTransform += `,c_${options.crop}`;
    if (options.aspectRatio) dimTransform += `,ar_${options.aspectRatio}`;
    transformations.push(dimTransform);
  }

  return cloudinary.url(publicId, {
    resource_type: 'video',
    transformation: transformations.join('/'),
    secure: true,
  });
}

/**
 * Generate a thumbnail URL from video
 */
export function getThumbnailUrl(
  publicId: string,
  timestamp: number = 0,
  options?: {
    width?: number;
    height?: number;
  }
): string {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { start_offset: timestamp },
      {
        width: options?.width || 640,
        height: options?.height || 360,
        crop: 'fill',
      },
    ],
    secure: true,
  });
}

/**
 * Upload from URL (useful for Replicate outputs)
 */
export async function uploadFromUrl(
  url: string,
  options?: {
    folder?: string;
    publicId?: string;
    resourceType?: 'video' | 'image' | 'raw';
  }
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(url, {
    resource_type: options?.resourceType || 'video',
    folder: options?.folder || 'clipforge/clips',
    public_id: options?.publicId,
    overwrite: true,
  });

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    format: result.format,
    duration: result.duration,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

export { cloudinary };

