// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { generateSocialContent, generateQuotes } from '@/lib/ai/openai';

// Generate content for a processed video
export async function POST(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      contentId, 
      platforms = ['twitter', 'linkedin'],
      toneOfVoice = 'professional',
      includeHashtags = true,
      includeEmojis = true,
    } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get content with transcription
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    if (!content.transcription) {
      return NextResponse.json(
        { error: 'Content has not been transcribed yet' },
        { status: 400 }
      );
    }

    // Parse segments
    const segments = content.transcription_segments || [];
    const highlights = segments.filter((s: { isHighlight?: boolean }) => s.isHighlight);

    // Generate social content
    const generatedContent = await generateSocialContent(
      content.transcription,
      highlights,
      {
        platforms,
        toneOfVoice,
        includeHashtags,
        includeEmojis,
      }
    );

    // Generate quotes
    const quotes = await generateQuotes(content.transcription);

    // Save generated content to database
    const savedContent = [];
    for (const item of generatedContent) {
      const { data: saved, error: saveError } = await supabase
        .from('generated_contents')
        .insert({
          content_id: contentId,
          user_id: user.id,
          type: `${item.platform}_${item.type}`,
          platform: item.platform,
          content: item.content,
          metadata: {
            hashtags: item.hashtags,
            toneOfVoice,
          },
          status: 'draft',
        })
        .select()
        .single();

      if (!saveError && saved) {
        savedContent.push(saved);
      }
    }

    // Save quotes as well
    for (const quote of quotes) {
      await supabase
        .from('generated_contents')
        .insert({
          content_id: contentId,
          user_id: user.id,
          type: 'quote_graphic',
          content: quote.quote,
          metadata: {
            attribution: quote.attribution,
          },
          status: 'draft',
        });
    }

    return NextResponse.json({
      success: true,
      generated: savedContent,
      quotes,
    });
  } catch (error) {
    console.error('Generate content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Regenerate specific content
export async function PUT(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { generatedContentId, customPrompt } = body;

    if (!generatedContentId) {
      return NextResponse.json(
        { error: 'Missing generatedContentId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get generated content with source
    const { data: generatedContent } = await supabase
      .from('generated_contents')
      .select('*, contents(*)')
      .eq('id', generatedContentId)
      .eq('user_id', user.id)
      .single();

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Generated content not found' },
        { status: 404 }
      );
    }

    const sourceContent = generatedContent.contents as { transcription?: string; transcription_segments?: unknown[] } | null;
    if (!sourceContent || !sourceContent.transcription) {
      return NextResponse.json(
        { error: 'Source content not found' },
        { status: 404 }
      );
    }

    // Regenerate using GPT-4
    const { generateSocialContent } = await import('@/lib/ai/openai');
    const segments = sourceContent.transcription_segments || [];
    const highlights = (segments as { isHighlight?: boolean }[]).filter((s) => s.isHighlight);

    const regenerated = await generateSocialContent(
      customPrompt 
        ? `${customPrompt}\n\nOriginal content:\n${sourceContent.transcription}`
        : sourceContent.transcription,
      highlights,
      {
        platforms: [generatedContent.platform],
        toneOfVoice: (generatedContent.metadata as { toneOfVoice?: string })?.toneOfVoice || 'professional',
        includeHashtags: true,
        includeEmojis: true,
      }
    );

    if (regenerated.length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from('generated_contents')
        .update({
          content: regenerated[0].content,
          metadata: {
            ...(generatedContent.metadata as object),
            hashtags: regenerated[0].hashtags,
            regeneratedAt: new Date().toISOString(),
          },
        })
        .eq('id', generatedContentId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        content: updated,
      });
    }

    return NextResponse.json(
      { error: 'Failed to regenerate content' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Regenerate content error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
