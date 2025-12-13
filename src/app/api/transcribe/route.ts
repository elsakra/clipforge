// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { transcribeAudio, analyzeHighlights, identifyClips } from '@/lib/ai/openai';
import { updateJob, getJob } from '@/lib/queue/redis';

// This would typically be called by a background worker
// For demo purposes, it can be triggered directly
export async function POST(request: Request) {
  try {
    // Verify internal request (in production, use a secret key)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      // For development, allow without auth
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { jobId, contentId, fileUrl } = body;

    if (!contentId || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update job status if jobId provided
    if (jobId) {
      await updateJob(jobId, { status: 'processing' });
    }

    try {
      // Step 1: Transcribe
      console.log('Starting transcription for content:', contentId);
      const transcription = await transcribeAudio(fileUrl);
      
      // Update content with transcription
      await supabase
        .from('contents')
        .update({
          status: 'analyzing',
          transcription: transcription.text,
          duration: transcription.duration,
        })
        .eq('id', contentId);

      // Step 2: Analyze highlights
      console.log('Analyzing highlights...');
      const analyzedSegments = await analyzeHighlights(
        transcription.text,
        transcription.segments
      );

      // Step 3: Identify clips
      console.log('Identifying clips...');
      const clipSuggestions = await identifyClips(
        transcription.text,
        analyzedSegments
      );

      // Update content with segments
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
        .select('user_id')
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

      // Update job as completed
      if (jobId) {
        await updateJob(jobId, {
          status: 'completed',
          result: {
            segmentsCount: analyzedSegments.length,
            clipsCount: clipSuggestions.length,
            duration: transcription.duration,
          },
        });
      }

      return NextResponse.json({
        success: true,
        transcription: {
          text: transcription.text,
          duration: transcription.duration,
          segmentsCount: analyzedSegments.length,
        },
        clips: clipSuggestions,
      });
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Update content status to error
      await supabase
        .from('contents')
        .update({ status: 'error' })
        .eq('id', contentId);

      // Update job as failed
      if (jobId) {
        await updateJob(jobId, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get transcription job status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Missing jobId' },
      { status: 400 }
    );
  }

  const job = await getJob(jobId);
  
  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ job });
}


