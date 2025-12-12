// Twitter/X API integration
// Uses OAuth 2.0 for user authentication

export interface TwitterConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profileImageUrl: string;
}

export interface TwitterPost {
  text: string;
  mediaIds?: string[];
  replyTo?: string;
}

const TWITTER_API_BASE = 'https://api.twitter.com/2';

/**
 * Generate OAuth 2.0 authorization URL
 */
export function getTwitterAuthUrl(state: string, codeChallenge: string): string {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const redirectUri = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`
  );
  
  const scopes = [
    'tweet.read',
    'tweet.write',
    'users.read',
    'offline.access',
  ].join('%20');

  return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeTwitterCode(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twitter auth failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh access token
 */
export async function refreshTwitterToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Twitter token');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get authenticated user info
 */
export async function getTwitterUser(accessToken: string): Promise<TwitterUser> {
  const response = await fetch(`${TWITTER_API_BASE}/users/me?user.fields=profile_image_url`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Twitter user');
  }

  const data = await response.json();
  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
    profileImageUrl: data.data.profile_image_url,
  };
}

/**
 * Post a tweet
 */
export async function postTweet(
  accessToken: string,
  post: TwitterPost
): Promise<{ id: string; text: string }> {
  const body: Record<string, unknown> = { text: post.text };
  
  if (post.mediaIds?.length) {
    body.media = { media_ids: post.mediaIds };
  }
  
  if (post.replyTo) {
    body.reply = { in_reply_to_tweet_id: post.replyTo };
  }

  const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to post tweet: ${error}`);
  }

  const data = await response.json();
  return {
    id: data.data.id,
    text: data.data.text,
  };
}

/**
 * Post a thread (multiple tweets)
 */
export async function postThread(
  accessToken: string,
  tweets: string[]
): Promise<Array<{ id: string; text: string }>> {
  const results: Array<{ id: string; text: string }> = [];
  let previousTweetId: string | undefined;

  for (const text of tweets) {
    const result = await postTweet(accessToken, {
      text,
      replyTo: previousTweetId,
    });
    results.push(result);
    previousTweetId = result.id;
  }

  return results;
}

/**
 * Upload media to Twitter
 */
export async function uploadTwitterMedia(
  accessToken: string,
  mediaUrl: string,
  mediaType: 'image' | 'video'
): Promise<string> {
  // Twitter media upload is complex and requires chunked upload for videos
  // For simplicity, this returns a placeholder - implement full upload for production
  
  // In production, you would:
  // 1. INIT - Initialize the upload
  // 2. APPEND - Upload chunks
  // 3. FINALIZE - Complete the upload
  // 4. STATUS - Check processing status for videos
  
  console.log('Media upload:', { mediaUrl, mediaType });
  throw new Error('Media upload requires implementation with Twitter Media API v1.1');
}


