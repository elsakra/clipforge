// Clip generation service using Replicate and Cloudinary
import { generateVideoClip, generateThumbnail as generateThumbnailReplicate } from '@/lib/replicate';
import { uploadFromUrl, getThumbnailUrl } from '@/lib/storage/cloudinary';

export interface ClipGenerationOptions {
  sourceUrl: string;
  startTime: number;
  endTime: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  outputFormat?: 'mp4' | 'webm';
  quality?: 'low' | 'medium' | 'high';
  captions?: {
    enabled: boolean;
    segments: Array<{
      start: number;
      end: number;
      text: string;
    }>;
    style: CaptionStyle;
  };
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  position: 'top' | 'middle' | 'bottom';
  animation: 'none' | 'fade' | 'typewriter' | 'highlight';
}

export interface ClipGenerationResult {
  success: boolean;
  clipUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

// Aspect ratio dimensions
const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
};

/**
 * Generate a clip using Replicate for processing and Cloudinary for storage
 */
export async function generateClip(options: ClipGenerationOptions): Promise<ClipGenerationResult> {
  const hasReplicate = !!process.env.REPLICATE_API_TOKEN;
  const hasCloudinary = !!process.env.CLOUDINARY_API_SECRET;

  // If no services configured, return mock for development
  if (!hasReplicate && !hasCloudinary) {
    console.log('No video processing services configured, returning mock result');
    return {
      success: true,
      clipUrl: `https://res.cloudinary.com/demo/video/upload/dog.mp4`,
      thumbnailUrl: `https://res.cloudinary.com/demo/video/upload/dog.jpg`,
      duration: options.endTime - options.startTime,
    };
  }

  try {
    let clipUrl: string;
    let thumbnailUrl: string;

    if (hasReplicate) {
      // Use Replicate for video processing
      console.log('Generating clip with Replicate:', {
        source: options.sourceUrl.slice(0, 50),
        start: options.startTime,
        end: options.endTime,
        ratio: options.aspectRatio,
      });

      const processedClipUrl = await generateVideoClip(
        options.sourceUrl,
        options.startTime,
        options.endTime,
        options.aspectRatio
      );

      // Generate thumbnail at the start of the clip
      const thumbnailOutputUrl = await generateThumbnailReplicate(
        options.sourceUrl,
        options.startTime + 1 // 1 second into the clip
      );

      // Upload to Cloudinary for permanent storage
      if (hasCloudinary) {
        const [clipResult, thumbResult] = await Promise.all([
          uploadFromUrl(processedClipUrl, {
            folder: 'clipforge/clips',
            resourceType: 'video',
          }),
          uploadFromUrl(thumbnailOutputUrl, {
            folder: 'clipforge/thumbnails',
            resourceType: 'image',
          }),
        ]);
        clipUrl = clipResult.secureUrl;
        thumbnailUrl = thumbResult.secureUrl;
      } else {
        // Use Replicate URLs directly (temporary)
        clipUrl = processedClipUrl;
        thumbnailUrl = thumbnailOutputUrl;
      }
    } else if (hasCloudinary) {
      // Use Cloudinary's video transformations (simpler but less powerful)
      const { getClipUrl } = await import('@/lib/storage/cloudinary');
      
      // Extract public ID from URL if it's a Cloudinary URL
      const publicIdMatch = options.sourceUrl.match(/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (publicIdMatch) {
        const publicId = publicIdMatch[1];
        const { width, height } = ASPECT_RATIOS[options.aspectRatio];
        
        clipUrl = getClipUrl(publicId, options.startTime, options.endTime, {
          width,
          height,
          crop: 'fill',
        });
        thumbnailUrl = getThumbnailUrl(publicId, options.startTime + 1);
      } else {
        throw new Error('Invalid source URL for Cloudinary processing');
      }
    } else {
      throw new Error('No video processing service configured');
    }

    return {
      success: true,
      clipUrl,
      thumbnailUrl,
      duration: options.endTime - options.startTime,
    };
  } catch (error) {
    console.error('Clip generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate thumbnail from video at specific time
 */
export async function generateThumbnail(
  videoUrl: string,
  timestamp: number
): Promise<string | null> {
  const hasReplicate = !!process.env.REPLICATE_API_TOKEN;
  const hasCloudinary = !!process.env.CLOUDINARY_API_SECRET;

  if (!hasReplicate && !hasCloudinary) {
    return `https://res.cloudinary.com/demo/video/upload/dog.jpg`;
  }

  try {
    if (hasReplicate) {
      const thumbnailUrl = await generateThumbnailReplicate(videoUrl, timestamp);
      
      if (hasCloudinary) {
        const result = await uploadFromUrl(thumbnailUrl, {
          folder: 'clipforge/thumbnails',
          resourceType: 'image',
        });
        return result.secureUrl;
      }
      
      return thumbnailUrl;
    } else if (hasCloudinary) {
      const publicIdMatch = videoUrl.match(/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
      if (publicIdMatch) {
        return getThumbnailUrl(publicIdMatch[1], timestamp);
      }
    }

    return null;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
}

/**
 * Batch generate clips for a content item
 */
export async function batchGenerateClips(
  clips: Array<{
    id: string;
    sourceUrl: string;
    startTime: number;
    endTime: number;
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  }>,
  onProgress?: (completed: number, total: number, clipId: string) => void
): Promise<Map<string, ClipGenerationResult>> {
  const results = new Map<string, ClipGenerationResult>();

  // Process clips sequentially to avoid rate limits
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    
    try {
      const result = await generateClip({
        sourceUrl: clip.sourceUrl,
        startTime: clip.startTime,
        endTime: clip.endTime,
        aspectRatio: clip.aspectRatio,
      });

      results.set(clip.id, result);
    } catch (error) {
      results.set(clip.id, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    onProgress?.(i + 1, clips.length, clip.id);
  }

  return results;
}
