export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          name: string | null
          image_url: string | null
          plan: 'free' | 'starter' | 'pro' | 'agency'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          usage_this_month: number
          usage_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          name?: string | null
          image_url?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'agency'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          usage_this_month?: number
          usage_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          name?: string | null
          image_url?: string | null
          plan?: 'free' | 'starter' | 'pro' | 'agency'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          usage_this_month?: number
          usage_limit?: number
          created_at?: string
          updated_at?: string
        }
      }
      contents: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          source_type: 'upload' | 'youtube' | 'tiktok' | 'url'
          source_url: string | null
          file_url: string | null
          thumbnail_url: string | null
          duration: number | null
          status: 'uploading' | 'processing' | 'transcribing' | 'analyzing' | 'ready' | 'error'
          transcription: string | null
          transcription_segments: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          source_type: 'upload' | 'youtube' | 'tiktok' | 'url'
          source_url?: string | null
          file_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          status?: 'uploading' | 'processing' | 'transcribing' | 'analyzing' | 'ready' | 'error'
          transcription?: string | null
          transcription_segments?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          source_type?: 'upload' | 'youtube' | 'tiktok' | 'url'
          source_url?: string | null
          file_url?: string | null
          thumbnail_url?: string | null
          duration?: number | null
          status?: 'uploading' | 'processing' | 'transcribing' | 'analyzing' | 'ready' | 'error'
          transcription?: string | null
          transcription_segments?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      clips: {
        Row: {
          id: string
          content_id: string
          user_id: string
          title: string
          start_time: number
          end_time: number
          duration: number
          aspect_ratio: '16:9' | '9:16' | '1:1' | '4:5'
          file_url: string | null
          thumbnail_url: string | null
          status: 'pending' | 'processing' | 'ready' | 'error'
          caption_style: Json | null
          viral_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          user_id: string
          title: string
          start_time: number
          end_time: number
          duration: number
          aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:5'
          file_url?: string | null
          thumbnail_url?: string | null
          status?: 'pending' | 'processing' | 'ready' | 'error'
          caption_style?: Json | null
          viral_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          user_id?: string
          title?: string
          start_time?: number
          end_time?: number
          duration?: number
          aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:5'
          file_url?: string | null
          thumbnail_url?: string | null
          status?: 'pending' | 'processing' | 'ready' | 'error'
          caption_style?: Json | null
          viral_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      generated_contents: {
        Row: {
          id: string
          content_id: string
          clip_id: string | null
          user_id: string
          type: string
          platform: string | null
          content: string
          metadata: Json
          status: 'draft' | 'scheduled' | 'published' | 'failed'
          scheduled_at: string | null
          published_at: string | null
          published_url: string | null
          engagement_metrics: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          clip_id?: string | null
          user_id: string
          type: string
          platform?: string | null
          content: string
          metadata?: Json
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          scheduled_at?: string | null
          published_at?: string | null
          published_url?: string | null
          engagement_metrics?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          clip_id?: string | null
          user_id?: string
          type?: string
          platform?: string | null
          content?: string
          metadata?: Json
          status?: 'draft' | 'scheduled' | 'published' | 'failed'
          scheduled_at?: string | null
          published_at?: string | null
          published_url?: string | null
          engagement_metrics?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      social_accounts: {
        Row: {
          id: string
          user_id: string
          platform: string
          platform_user_id: string
          platform_username: string
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          platform_user_id: string
          platform_username: string
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          platform_user_id?: string
          platform_username?: string
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      scheduled_posts: {
        Row: {
          id: string
          user_id: string
          generated_content_id: string
          platform: string
          scheduled_at: string
          status: 'scheduled' | 'publishing' | 'published' | 'failed'
          error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          generated_content_id: string
          platform: string
          scheduled_at: string
          status?: 'scheduled' | 'publishing' | 'published' | 'failed'
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          generated_content_id?: string
          platform?: string
          scheduled_at?: string
          status?: 'scheduled' | 'publishing' | 'published' | 'failed'
          error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          plan: 'starter' | 'pro' | 'agency'
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          plan: 'starter' | 'pro' | 'agency'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          stripe_price_id?: string
          plan?: 'starter' | 'pro' | 'agency'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}


