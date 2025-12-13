import OpenAI from 'openai';

// Lazy initialize OpenAI client
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
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

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
  duration: number;
  language: string;
}

/**
 * Transcribe audio/video using OpenAI Whisper
 */
export async function transcribeAudio(
  audioUrl: string,
  options?: {
    language?: string;
    prompt?: string;
  }
): Promise<TranscriptionResult> {
  // Download the audio file
  const response = await fetch(audioUrl);
  const audioBuffer = await response.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
  const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });

  // Get detailed transcription with timestamps
  const transcription = await getOpenAI().audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: options?.language,
    prompt: options?.prompt,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  // Process segments
  const segments: TranscriptionSegment[] = (transcription.segments || []).map((seg, index) => ({
    id: `seg-${index}`,
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
    speaker: null, // Speaker detection would require additional processing
    confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.9,
    isHighlight: false, // Will be determined by AI analysis
  }));

  return {
    text: transcription.text,
    segments,
    duration: transcription.duration || 0,
    language: transcription.language || 'en',
  };
}

/**
 * Analyze transcription to identify viral/highlight moments
 */
export async function analyzeHighlights(
  transcription: string,
  segments: TranscriptionSegment[]
): Promise<TranscriptionSegment[]> {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at identifying viral moments in content. Analyze the transcription and identify segments that would make great short-form clips. Look for:
- Strong hooks or attention-grabbing statements
- Emotional moments
- Key insights or revelations
- Quotable phrases
- Surprising facts or statistics
- Story climaxes
- Calls to action

Return a JSON array of segment indices (0-based) that should be marked as highlights. Only include the most impactful 5-10 segments.`,
      },
      {
        role: 'user',
        content: `Transcription:\n${transcription}\n\nSegments:\n${segments.map((s, i) => `[${i}] ${s.start.toFixed(1)}-${s.end.toFixed(1)}s: "${s.text}"`).join('\n')}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"highlights":[]}');
  const highlightIndices = new Set(result.highlights || []);

  return segments.map((segment, index) => ({
    ...segment,
    isHighlight: highlightIndices.has(index),
  }));
}

export interface GeneratedSocialContent {
  platform: string;
  type: string;
  content: string;
  hashtags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Generate social media content from transcription
 */
export async function generateSocialContent(
  transcription: string,
  highlights: TranscriptionSegment[],
  options: {
    platforms: string[];
    toneOfVoice: 'professional' | 'casual' | 'humorous' | 'inspirational';
    includeHashtags: boolean;
    includeEmojis: boolean;
  }
): Promise<GeneratedSocialContent[]> {
  const platformInstructions: Record<string, string> = {
    twitter: 'Create a thread of 3-5 tweets. First tweet should be a strong hook. Keep each tweet under 280 characters.',
    linkedin: 'Create a professional LinkedIn post (1500 chars max) with clear formatting, line breaks, and a call to action.',
    instagram: 'Create an Instagram caption (2200 chars max) with emojis and hashtags at the end.',
    tiktok: 'Create a short, punchy TikTok caption (150 chars max) with trending hashtags.',
    youtube: 'Create a YouTube description with timestamps, key points, and relevant links section.',
    blog: 'Create a blog post outline with introduction, main points, and conclusion.',
    newsletter: 'Create a newsletter section with an engaging subject line and body content.',
  };

  const toneDescriptions: Record<string, string> = {
    professional: 'Professional, authoritative, and business-focused',
    casual: 'Friendly, conversational, and relatable',
    humorous: 'Witty, playful, with clever observations',
    inspirational: 'Motivating, uplifting, and empowering',
  };

  const results: GeneratedSocialContent[] = [];

  for (const platform of options.platforms) {
    const instruction = platformInstructions[platform];
    if (!instruction) continue;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert social media content creator. Create engaging content for ${platform}.

Tone: ${toneDescriptions[options.toneOfVoice]}
${options.includeHashtags ? 'Include relevant hashtags.' : 'Do not include hashtags.'}
${options.includeEmojis ? 'Use emojis appropriately.' : 'Do not use emojis.'}

${instruction}

Focus on the most interesting and valuable insights from the content. Make it engaging and shareable.

Return JSON with fields: "content" (string), "hashtags" (array of strings, without #), "type" (string: post/thread/caption/description/outline)`,
        },
        {
          role: 'user',
          content: `Main transcription:\n${transcription.slice(0, 4000)}\n\nKey highlights:\n${highlights
            .filter((h) => h.isHighlight)
            .map((h) => `- "${h.text}"`)
            .join('\n')}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    results.push({
      platform,
      type: result.type || 'post',
      content: result.content || '',
      hashtags: result.hashtags || [],
      metadata: {},
    });
  }

  return results;
}

/**
 * Identify clip suggestions from transcription
 */
export async function identifyClips(
  transcription: string,
  segments: TranscriptionSegment[],
  targetCount: number = 5
): Promise<Array<{ title: string; startIndex: number; endIndex: number; viralScore: number }>> {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at identifying viral short-form content. Analyze the transcription and identify ${targetCount} clips that would perform well on social media.

For each clip:
- Should be 15-60 seconds long
- Should be self-contained (makes sense without context)
- Should have a strong hook at the start
- Should provide value or entertainment

Return JSON with "clips" array containing objects with:
- "title": Catchy title for the clip
- "startIndex": Index of first segment
- "endIndex": Index of last segment
- "viralScore": 0-100 score predicting viral potential
- "reason": Brief explanation of why this clip would perform well`,
      },
      {
        role: 'user',
        content: `Segments:\n${segments.map((s, i) => `[${i}] ${s.start.toFixed(1)}-${s.end.toFixed(1)}s: "${s.text}"`).join('\n')}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"clips":[]}');
  return result.clips || [];
}

/**
 * Generate quote graphics text
 */
export async function generateQuotes(
  transcription: string,
  count: number = 5
): Promise<Array<{ quote: string; attribution?: string }>> {
  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Extract ${count} powerful, quotable statements from the transcription. These should be:
- Concise (under 150 characters)
- Impactful and memorable
- Suitable for quote graphics
- Self-contained (understandable without context)

Return JSON with "quotes" array containing objects with "quote" and optional "attribution" fields.`,
      },
      {
        role: 'user',
        content: transcription.slice(0, 8000),
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"quotes":[]}');
  return result.quotes || [];
}

export { getOpenAI };


