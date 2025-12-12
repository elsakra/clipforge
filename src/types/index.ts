// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  plan: 'free' | 'starter' | 'pro' | 'agency';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  usageThisMonth: number;
  usageLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

// Content types
export interface Content {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  sourceType: 'upload' | 'youtube' | 'tiktok' | 'url';
  sourceUrl: string | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null; // in seconds
  status: ContentStatus;
  transcription: string | null;
  transcriptionSegments: TranscriptionSegment[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentStatus = 
  | 'uploading'
  | 'processing'
  | 'transcribing'
  | 'analyzing'
  | 'ready'
  | 'error';

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker: string | null;
  confidence: number;
  isHighlight: boolean;
}

// Clip types
export interface Clip {
  id: string;
  contentId: string;
  userId: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  fileUrl: string | null;
  thumbnailUrl: string | null;
  status: ClipStatus;
  captionStyle: CaptionStyle | null;
  viralScore: number | null; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export type ClipStatus = 
  | 'pending'
  | 'processing'
  | 'ready'
  | 'error';

export interface CaptionStyle {
  enabled: boolean;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  position: 'top' | 'middle' | 'bottom';
  animation: 'none' | 'fade' | 'typewriter' | 'highlight';
}

// Generated content types
export interface GeneratedContent {
  id: string;
  contentId: string;
  clipId: string | null;
  userId: string;
  type: GeneratedContentType;
  platform: Platform | null;
  content: string;
  metadata: Record<string, unknown>;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt: Date | null;
  publishedAt: Date | null;
  publishedUrl: string | null;
  engagementMetrics: EngagementMetrics | null;
  createdAt: Date;
  updatedAt: Date;
}

export type GeneratedContentType = 
  | 'twitter_post'
  | 'twitter_thread'
  | 'linkedin_post'
  | 'instagram_caption'
  | 'tiktok_caption'
  | 'youtube_description'
  | 'blog_post'
  | 'newsletter'
  | 'quote_graphic';

export type Platform = 
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook';

export interface EngagementMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  impressions: number;
}

// Schedule types
export interface ScheduledPost {
  id: string;
  userId: string;
  generatedContentId: string;
  platform: Platform;
  scheduledAt: Date;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Social account types
export interface SocialAccount {
  id: string;
  userId: string;
  platform: Platform;
  platformUserId: string;
  platformUsername: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics types
export interface Analytics {
  totalContent: number;
  totalClips: number;
  totalPosts: number;
  totalEngagement: EngagementMetrics;
  timeSaved: number; // in minutes
  contentByPlatform: Record<Platform, number>;
  engagementByPlatform: Record<Platform, EngagementMetrics>;
  topPerformingContent: GeneratedContent[];
  usageOverTime: UsageDataPoint[];
}

export interface UsageDataPoint {
  date: string;
  contentProcessed: number;
  clipsGenerated: number;
  postsPublished: number;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: 'starter' | 'pro' | 'agency';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pricing configuration
export const PRICING = {
  starter: {
    name: 'Starter',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
    features: [
      '10 videos per month',
      'Auto-transcription',
      'AI clip suggestions',
      'Social post generation',
      'Basic analytics',
    ],
    limits: {
      videosPerMonth: 10,
      clipsPerVideo: 5,
      platforms: ['twitter', 'linkedin'] as Platform[],
    },
  },
  pro: {
    name: 'Pro',
    price: 79,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
    features: [
      '50 videos per month',
      'Everything in Starter',
      'All social platforms',
      'Content calendar',
      'Auto-scheduling',
      'Advanced analytics',
      'Priority support',
    ],
    limits: {
      videosPerMonth: 50,
      clipsPerVideo: 15,
      platforms: ['twitter', 'linkedin', 'instagram', 'tiktok', 'youtube', 'facebook'] as Platform[],
    },
  },
  agency: {
    name: 'Agency',
    price: 199,
    priceId: process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID || '',
    features: [
      'Unlimited videos',
      'Everything in Pro',
      'Team collaboration',
      'White-label exports',
      'API access',
      'Custom integrations',
      'Dedicated support',
    ],
    limits: {
      videosPerMonth: -1, // unlimited
      clipsPerVideo: -1, // unlimited
      platforms: ['twitter', 'linkedin', 'instagram', 'tiktok', 'youtube', 'facebook'] as Platform[],
    },
  },
} as const;

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface UploadFormData {
  file?: File;
  url?: string;
  title: string;
  description?: string;
}

export interface ContentGenerationOptions {
  platforms: Platform[];
  toneOfVoice: 'professional' | 'casual' | 'humorous' | 'inspirational';
  includeHashtags: boolean;
  includeEmojis: boolean;
  threadLength?: number; // for Twitter threads
}


