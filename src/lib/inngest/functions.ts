// @ts-nocheck
import { inngest } from './client';
import { createAdminClient } from '@/lib/supabase/server';
import { transcribeWithReplicate } from '@/lib/replicate';
import { transcribeAudio, analyzeHighlights, identifyClips } from '@/lib/ai/openai';
import { generateClip } from '@/lib/video/clip-generator';

/**
 * Process uploaded content - transcribe and analyze
 */
export const processContent = inngest.createFunction(
  {
    id: 'process-content',
    retries: 3,
  },
  { event: 'content/uploaded' },
  async ({ event, step }) => {
    const { contentId, userId, fileUrl, title } = event.data;
    const supabase = createAdminClient();

    // Step 1: Update status to transcribing
    await step.run('update-status-transcribing', async () => {
      await supabase
        .from('contents')
        .update({ status: 'transcribing' })
        .eq('id', contentId);
    });

    // Step 2: Transcribe audio/video
    const transcription = await step.run('transcribe-content', async () => {
      try {
        // Try Replicate first (faster for large files)
        if (process.env.REPLICATE_API_TOKEN) {
          return await transcribeWithReplicate(fileUrl);
        }
        // Fall back to OpenAI
        return await transcribeAudio(fileUrl);
      } catch (error) {
        console.error('Transcription error:', error);
        throw error;
      }
    });

    // Step 3: Update with transcription and change status
    await step.run('save-transcription', async () => {
      await supabase
        .from('contents')
        .update({
          status: 'analyzing',
          transcription: transcription.text,
          duration: transcription.duration,
        })
        .eq('id', contentId);
    });

    // Step 4: Analyze highlights
    const analyzedSegments = await step.run('analyze-highlights', async () => {
      return await analyzeHighlights(transcription.text, transcription.segments);
    });

    // Step 5: Identify clip suggestions
    const clipSuggestions = await step.run('identify-clips', async () => {
      return await identifyClips(transcription.text, analyzedSegments);
    });

    // Step 6: Save segments and create clip records
    await step.run('save-clips', async () => {
      // Update content with analyzed segments
      await supabase
        .from('contents')
        .update({
          status: 'ready',
          transcription_segments: analyzedSegments,
        })
        .eq('id', contentId);

      // Get user_id from content
      const { data: content } = await supabase
        .from('contents')
        .select('user_id, file_url')
        .eq('id', contentId)
        .single();

      if (content) {
        // Create clip records
        for (const suggestion of clipSuggestions) {
          const startSegment = analyzedSegments[suggestion.startIndex];
          const endSegment = analyzedSegments[suggestion.endIndex];

          if (startSegment && endSegment) {
            await supabase.from('clips').insert({
              content_id: contentId,
              user_id: content.user_id,
              title: suggestion.title,
              start_time: startSegment.start,
              end_time: endSegment.end,
              duration: endSegment.end - startSegment.start,
              viral_score: suggestion.viralScore,
              status: 'pending',
            });
          }
        }
      }
    });

    return {
      success: true,
      contentId,
      segmentsCount: analyzedSegments.length,
      clipsCount: clipSuggestions.length,
    };
  }
);

/**
 * Generate a video clip
 */
export const generateClipFunction = inngest.createFunction(
  {
    id: 'generate-clip',
    retries: 2,
  },
  { event: 'clip/generation.requested' },
  async ({ event, step }) => {
    const { clipId, sourceUrl, startTime, endTime, aspectRatio } = event.data;
    const supabase = createAdminClient();

    // Step 1: Update status to processing
    await step.run('update-status-processing', async () => {
      await supabase
        .from('clips')
        .update({ status: 'processing' })
        .eq('id', clipId);
    });

    // Step 2: Generate the clip
    const result = await step.run('generate-clip', async () => {
      return await generateClip({
        sourceUrl,
        startTime,
        endTime,
        aspectRatio,
      });
    });

    // Step 3: Update clip record with result
    await step.run('save-clip-result', async () => {
      if (result.success) {
        await supabase
          .from('clips')
          .update({
            status: 'ready',
            file_url: result.clipUrl,
            thumbnail_url: result.thumbnailUrl,
          })
          .eq('id', clipId);
      } else {
        await supabase
          .from('clips')
          .update({
            status: 'error',
          })
          .eq('id', clipId);
      }
    });

    return result;
  }
);

// Export all functions
export const functions = [processContent, generateClipFunction];

