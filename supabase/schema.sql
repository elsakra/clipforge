-- ClipForge Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  usage_this_month INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contents table (uploaded videos/audio)
CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'youtube', 'tiktok', 'url')),
  source_url TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'transcribing', 'analyzing', 'ready', 'error')),
  transcription TEXT,
  transcription_segments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clips table (extracted video clips)
CREATE TABLE IF NOT EXISTS clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  duration FLOAT NOT NULL,
  aspect_ratio TEXT DEFAULT '16:9' CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:5')),
  file_url TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  caption_style JSONB,
  viral_score INTEGER CHECK (viral_score >= 0 AND viral_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated contents table (social posts, blogs, etc.)
CREATE TABLE IF NOT EXISTS generated_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES clips(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  platform TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_url TEXT,
  engagement_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social accounts table (connected platforms)
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generated_content_id UUID NOT NULL REFERENCES generated_contents(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'agency')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents(user_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_clips_content_id ON clips(content_id);
CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_contents_user_id ON generated_contents(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_contents_content_id ON generated_contents(content_id);
CREATE INDEX IF NOT EXISTS idx_generated_contents_status ON generated_contents(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clips_updated_at BEFORE UPDATE ON clips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_contents_updated_at BEFORE UPDATE ON generated_contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- Content policies
CREATE POLICY "Users can view own contents" ON contents FOR SELECT USING (true);
CREATE POLICY "Users can insert own contents" ON contents FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own contents" ON contents FOR UPDATE USING (true);
CREATE POLICY "Users can delete own contents" ON contents FOR DELETE USING (true);

-- Clips policies
CREATE POLICY "Users can view own clips" ON clips FOR SELECT USING (true);
CREATE POLICY "Users can insert own clips" ON clips FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own clips" ON clips FOR UPDATE USING (true);
CREATE POLICY "Users can delete own clips" ON clips FOR DELETE USING (true);

-- Generated contents policies
CREATE POLICY "Users can view own generated contents" ON generated_contents FOR SELECT USING (true);
CREATE POLICY "Users can insert own generated contents" ON generated_contents FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own generated contents" ON generated_contents FOR UPDATE USING (true);
CREATE POLICY "Users can delete own generated contents" ON generated_contents FOR DELETE USING (true);

-- Social accounts policies
CREATE POLICY "Users can view own social accounts" ON social_accounts FOR SELECT USING (true);
CREATE POLICY "Users can insert own social accounts" ON social_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own social accounts" ON social_accounts FOR UPDATE USING (true);
CREATE POLICY "Users can delete own social accounts" ON social_accounts FOR DELETE USING (true);

-- Scheduled posts policies
CREATE POLICY "Users can view own scheduled posts" ON scheduled_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own scheduled posts" ON scheduled_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own scheduled posts" ON scheduled_posts FOR UPDATE USING (true);
CREATE POLICY "Users can delete own scheduled posts" ON scheduled_posts FOR DELETE USING (true);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (true);

-- Function to increment user usage count
CREATE OR REPLACE FUNCTION increment_usage(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET usage_this_month = usage_this_month + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (call via cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE users SET usage_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_content BIGINT,
  total_clips BIGINT,
  total_posts BIGINT,
  time_saved INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM contents WHERE user_id = p_user_id)::BIGINT as total_content,
    (SELECT COUNT(*) FROM clips WHERE user_id = p_user_id)::BIGINT as total_clips,
    (SELECT COUNT(*) FROM generated_contents WHERE user_id = p_user_id)::BIGINT as total_posts,
    (SELECT COALESCE(SUM(duration), 0)::INTEGER FROM contents WHERE user_id = p_user_id AND status = 'ready') as time_saved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


