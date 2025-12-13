// @ts-nocheck
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Cron job to reset monthly usage for all users
 * This is triggered by Vercel cron at the start of each month
 * Schedule: 0 0 1 * * (midnight on the 1st of each month)
 */
export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request from Vercel
    const authHeader = request.headers.get('authorization');
    
    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production') {
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const supabase = createAdminClient();

    // Call the reset_monthly_usage function defined in the schema
    const { error } = await supabase.rpc('reset_monthly_usage');

    if (error) {
      console.error('Error resetting monthly usage:', error);
      return NextResponse.json(
        { error: 'Failed to reset monthly usage', details: error.message },
        { status: 500 }
      );
    }

    console.log('Monthly usage reset completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Monthly usage reset completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron reset-usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: Request) {
  return GET(request);
}

