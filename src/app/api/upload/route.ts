// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { generateUploadSignature } from '@/lib/storage/cloudinary';

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
    const { filename, contentType, fileSize, title, description, sourceType = 'upload' } = body;

    // Validate input
    if (!filename || !contentType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, contentType, fileSize' },
        { status: 400 }
      );
    }

    // Validate file type
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm'];
    const isValid = [...validVideoTypes, ...validAudioTypes].includes(contentType);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a video or audio file.' },
        { status: 400 }
      );
    }

    // Get user from database to check plan limits
    const supabase = createAdminClient();
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Create user if doesn't exist
    let currentUser = dbUser;
    if (!currentUser) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          plan: 'free',
          usage_limit: 3,
          usage_this_month: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
      currentUser = newUser;
    }

    // Check file size limit based on plan
    const maxFileSizes: Record<string, number> = {
      free: 100 * 1024 * 1024, // 100 MB
      starter: 500 * 1024 * 1024, // 500 MB
      pro: 2 * 1024 * 1024 * 1024, // 2 GB
      agency: 5 * 1024 * 1024 * 1024, // 5 GB
    };
    
    const plan = currentUser.plan as string;
    const maxSize = maxFileSizes[plan] || maxFileSizes.free;
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds limit for ${plan} plan. Maximum: ${maxSize / (1024 * 1024)} MB` },
        { status: 400 }
      );
    }

    // Check usage limit
    if (currentUser.usage_this_month >= currentUser.usage_limit && plan !== 'agency') {
      return NextResponse.json(
        { error: 'You have reached your monthly content limit. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Generate Cloudinary upload signature
    const hasCloudinary = !!process.env.CLOUDINARY_API_SECRET;
    let uploadUrl: string = '';
    let storageKey: string;
    let cloudinarySignature: ReturnType<typeof generateUploadSignature> | null = null;

    if (hasCloudinary) {
      const folder = `clipforge/${user.id}`;
      cloudinarySignature = generateUploadSignature(folder, 'video');
      uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinarySignature.cloudName}/auto/upload`;
      storageKey = folder;
    } else {
      // Development mode
      storageKey = `dev/${user.id}/${Date.now()}-${filename}`;
    }

    // Create content record in database
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: user.id,
        title: title || filename.replace(/\.[^/.]+$/, ''),
        description,
        source_type: sourceType,
        file_url: storageKey,
        status: 'uploading',
      })
      .select()
      .single();

    if (contentError) {
      console.error('Error creating content:', contentError);
      return NextResponse.json(
        { error: 'Failed to create content record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl,
      contentId: content.id,
      storageKey,
      uploadMethod: hasCloudinary ? 'cloudinary' : 'direct',
      cloudinarySignature,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Confirm upload completion
export async function PATCH(request: Request) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentId, fileUrl } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update content status and file URL if provided
    const updateData: Record<string, unknown> = { status: 'processing' };
    if (fileUrl) {
      updateData.file_url = fileUrl;
    }

    const { data: content, error: updateError } = await supabase
      .from('contents')
      .update(updateData)
      .eq('id', contentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating content:', updateError);
      return NextResponse.json(
        { error: 'Failed to update content status' },
        { status: 500 }
      );
    }

    // Increment usage count
    await supabase.rpc('increment_usage', { p_user_id: user.id });

    // Trigger processing via Inngest
    try {
      const { inngest } = await import('@/lib/inngest/client');
      await inngest.send({
        name: 'content/uploaded',
        data: {
          contentId,
          userId: user.id,
          fileUrl: content.file_url,
          title: content.title,
        },
      });
    } catch (inngestError) {
      console.error('Failed to trigger Inngest:', inngestError);
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error('Upload confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
