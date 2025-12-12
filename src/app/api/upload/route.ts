import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateUploadSignature } from '@/lib/storage/cloudinary';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Create user if doesn't exist
    let dbUser = user;
    if (!dbUser) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: 'pending@clipforge.ai', // Will be updated by webhook
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
      dbUser = newUser;
    }

    // Check file size limit based on plan
    const maxFileSizes: Record<string, number> = {
      free: 100 * 1024 * 1024, // 100 MB
      starter: 500 * 1024 * 1024, // 500 MB
      pro: 2 * 1024 * 1024 * 1024, // 2 GB
      agency: 5 * 1024 * 1024 * 1024, // 5 GB
    };
    
    const plan = dbUser.plan as string;
    const maxSize = maxFileSizes[plan] || maxFileSizes.free;
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds limit for ${plan} plan. Maximum: ${maxSize / (1024 * 1024)} MB` },
        { status: 400 }
      );
    }

    // Check usage limit
    if (dbUser.usage_this_month >= dbUser.usage_limit && plan !== 'agency') {
      return NextResponse.json(
        { error: 'You have reached your monthly content limit. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Determine storage backend
    const hasCloudinary = !!process.env.CLOUDINARY_API_SECRET;
    const hasR2 = !!process.env.R2_SECRET_ACCESS_KEY;

    let uploadUrl: string;
    let storageKey: string;
    let uploadMethod: 'cloudinary' | 'r2' | 'direct';
    let cloudinarySignature: ReturnType<typeof generateUploadSignature> | null = null;

    if (hasCloudinary) {
      // Use Cloudinary signed upload
      uploadMethod = 'cloudinary';
      const folder = `clipforge/${dbUser.id}`;
      cloudinarySignature = generateUploadSignature(folder, 'video');
      uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinarySignature.cloudName}/auto/upload`;
      storageKey = folder; // Will be updated after upload with actual public_id
    } else if (hasR2) {
      // Use R2 pre-signed URL
      uploadMethod = 'r2';
      const { getUploadUrl, generateStorageKey, getFileCategory } = await import('@/lib/storage/r2');
      const fileCategory = getFileCategory(contentType);
      if (!fileCategory) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
      }
      storageKey = generateStorageKey(dbUser.id, fileCategory, filename);
      uploadUrl = await getUploadUrl({ key: storageKey, contentType, expiresIn: 3600 });
    } else {
      // No storage configured - development mode
      uploadMethod = 'direct';
      uploadUrl = '';
      storageKey = `dev/${dbUser.id}/${Date.now()}-${filename}`;
    }

    // Create content record in database
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .insert({
        user_id: dbUser.id,
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
      uploadMethod,
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
    const { userId } = await auth();
    
    if (!userId) {
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
    
    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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
    await supabase
      .from('users')
      .update({ usage_this_month: user.id })
      .eq('id', user.id);

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
      // Don't fail the request, processing can be triggered manually
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
