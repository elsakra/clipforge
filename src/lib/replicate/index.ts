// @ts-nocheck
import Replicate from 'replicate';

// Lazy initialize Replicate client
let replicateInstance: Replicate | null = null;

function getReplicate(): Replicate {
  if (!replicateInstance) {
    replicateInstance = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }
  return replicateInstance;
}

const replicate = {
  get run() { return getReplicate().run.bind(getReplicate()); },
  get predictions() { return getReplicate().predictions; },
};

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  duration: number;
  language: string;
}

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker: string | null;
  confidence: number;
  isHighlight: boolean;
}

/**
 * Transcribe audio/video using Replicate's Whisper model
 * This is faster for large files than OpenAI's API
 */
export async function transcribeWithReplicate(
  audioUrl: string,
  options?: {
    language?: string;
  }
): Promise<TranscriptionResult> {
  try {
    const output = await replicate.run(
      'openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2',
      {
        input: {
          audio: audioUrl,
          model: 'large-v3',
          language: options?.language || 'en',
          translate: false,
          temperature: 0,
          transcription: 'srt',
          suppress_tokens: '-1',
          logprob_threshold: -1,
          no_speech_threshold: 0.6,
          condition_on_previous_text: true,
          compression_ratio_threshold: 2.4,
          temperature_increment_on_fallback: 0.2,
        },
      }
    ) as { transcription: string; segments: Array<{ start: number; end: number; text: string }> };

    // Parse SRT output to segments
    const segments = parseWhisperOutput(output);
    const fullText = segments.map(s => s.text).join(' ');
    const duration = segments.length > 0 ? segments[segments.length - 1].end : 0;

    return {
      text: fullText,
      segments: segments.map((seg, index) => ({
        id: `seg-${index}`,
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
        speaker: null,
        confidence: 0.95,
        isHighlight: false,
      })),
      duration,
      language: options?.language || 'en',
    };
  } catch (error) {
    console.error('Replicate transcription error:', error);
    throw error;
  }
}

/**
 * Parse Whisper SRT output to segments
 */
function parseWhisperOutput(output: unknown): Array<{ start: number; end: number; text: string }> {
  // Handle different output formats from Replicate
  if (typeof output === 'object' && output !== null) {
    const out = output as Record<string, unknown>;
    if (Array.isArray(out.segments)) {
      return out.segments.map((seg: { start: number; end: number; text: string }) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
      }));
    }
    if (typeof out.transcription === 'string') {
      // Parse SRT format
      return parseSRT(out.transcription);
    }
  }
  if (typeof output === 'string') {
    return parseSRT(output);
  }
  return [];
}

/**
 * Parse SRT subtitle format
 */
function parseSRT(srt: string): Array<{ start: number; end: number; text: string }> {
  const segments: Array<{ start: number; end: number; text: string }> = [];
  const blocks = srt.trim().split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const timeLine = lines[1];
      const textLines = lines.slice(2).join(' ');

      const timeMatch = timeLine.match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
      );

      if (timeMatch) {
        const start =
          parseInt(timeMatch[1]) * 3600 +
          parseInt(timeMatch[2]) * 60 +
          parseInt(timeMatch[3]) +
          parseInt(timeMatch[4]) / 1000;
        const end =
          parseInt(timeMatch[5]) * 3600 +
          parseInt(timeMatch[6]) * 60 +
          parseInt(timeMatch[7]) +
          parseInt(timeMatch[8]) / 1000;

        segments.push({ start, end, text: textLines });
      }
    }
  }

  return segments;
}

/**
 * Extract audio from video using Replicate's FFmpeg
 */
export async function extractAudio(videoUrl: string): Promise<string> {
  try {
    const output = await replicate.run(
      'cjwbw/ffmpeg:12af04f38a75ad6e41515db0e5e8a83ae3a9d15eac0cdc0e0a4bd4e9fb3b3c5a',
      {
        input: {
          input_file: videoUrl,
          ffmpeg_options: '-vn -acodec libmp3lame -q:a 2',
          output_extension: 'mp3',
        },
      }
    ) as string;

    return output;
  } catch (error) {
    console.error('Audio extraction error:', error);
    throw error;
  }
}

/**
 * Generate video clip using Replicate's FFmpeg
 */
export async function generateVideoClip(
  videoUrl: string,
  startTime: number,
  endTime: number,
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5' = '9:16'
): Promise<string> {
  const duration = endTime - startTime;
  
  // Calculate dimensions for aspect ratio
  const dimensions: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '1:1': { width: 1080, height: 1080 },
    '4:5': { width: 1080, height: 1350 },
  };

  const { width, height } = dimensions[aspectRatio];

  try {
    // Use FFmpeg to cut and resize
    const ffmpegOptions = [
      `-ss ${startTime}`,
      `-t ${duration}`,
      `-vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2"`,
      '-c:v libx264 -crf 23 -preset medium',
      '-c:a aac -b:a 128k',
    ].join(' ');

    const output = await replicate.run(
      'cjwbw/ffmpeg:12af04f38a75ad6e41515db0e5e8a83ae3a9d15eac0cdc0e0a4bd4e9fb3b3c5a',
      {
        input: {
          input_file: videoUrl,
          ffmpeg_options: ffmpegOptions,
          output_extension: 'mp4',
        },
      }
    ) as string;

    return output;
  } catch (error) {
    console.error('Video clip generation error:', error);
    throw error;
  }
}

/**
 * Generate thumbnail from video at specific timestamp
 */
export async function generateThumbnail(
  videoUrl: string,
  timestamp: number
): Promise<string> {
  try {
    const output = await replicate.run(
      'cjwbw/ffmpeg:12af04f38a75ad6e41515db0e5e8a83ae3a9d15eac0cdc0e0a4bd4e9fb3b3c5a',
      {
        input: {
          input_file: videoUrl,
          ffmpeg_options: `-ss ${timestamp} -vframes 1 -vf "scale=640:360"`,
          output_extension: 'jpg',
        },
      }
    ) as string;

    return output;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw error;
  }
}

/**
 * Add captions/subtitles to video
 */
export async function addCaptionsToVideo(
  videoUrl: string,
  segments: Array<{ start: number; end: number; text: string }>,
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    position?: 'top' | 'middle' | 'bottom';
  }
): Promise<string> {
  // Convert segments to SRT format
  const srtContent = segments
    .map((seg, i) => {
      const startFormatted = formatSRTTime(seg.start);
      const endFormatted = formatSRTTime(seg.end);
      return `${i + 1}\n${startFormatted} --> ${endFormatted}\n${seg.text}`;
    })
    .join('\n\n');

  // For now, return the video URL - actual caption burning would need
  // a more complex setup with subtitle files
  console.log('Caption SRT generated:', srtContent.slice(0, 200));
  
  // TODO: Implement actual caption burning with ASS/SRT file upload
  return videoUrl;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Check if a Replicate prediction is complete
 */
export async function checkPredictionStatus(predictionId: string): Promise<{
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: unknown;
  error?: string;
}> {
  const prediction = await replicate.predictions.get(predictionId);
  return {
    status: prediction.status,
    output: prediction.output,
    error: prediction.error,
  };
}

/**
 * Start a long-running prediction and return the prediction ID
 */
export async function startTranscriptionAsync(audioUrl: string): Promise<string> {
  const prediction = await replicate.predictions.create({
    version: '4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2',
    input: {
      audio: audioUrl,
      model: 'large-v3',
      language: 'en',
      translate: false,
      temperature: 0,
      transcription: 'srt',
    },
  });

  return prediction.id;
}

export { replicate };

