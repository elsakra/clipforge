// LinkedIn API integration
// Uses OAuth 2.0 for user authentication

export interface LinkedInUser {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}

export interface LinkedInPost {
  text: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'ARTICLE';
  visibility?: 'PUBLIC' | 'CONNECTIONS';
}

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

/**
 * Generate OAuth 2.0 authorization URL
 */
export function getLinkedInAuthUrl(state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`
  );
  
  const scopes = [
    'openid',
    'profile',
    'w_member_social',
  ].join('%20');

  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeLinkedInCode(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn auth failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get authenticated user info
 */
export async function getLinkedInUser(accessToken: string): Promise<LinkedInUser> {
  const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get LinkedIn user');
  }

  const data = await response.json();
  return {
    id: data.sub,
    firstName: data.given_name,
    lastName: data.family_name,
    profilePicture: data.picture || null,
  };
}

/**
 * Create a post on LinkedIn
 */
export async function createLinkedInPost(
  accessToken: string,
  userId: string,
  post: LinkedInPost
): Promise<{ id: string; url: string }> {
  const body: Record<string, unknown> = {
    author: `urn:li:person:${userId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: post.text,
        },
        shareMediaCategory: post.mediaUrl ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': post.visibility || 'PUBLIC',
    },
  };

  // If there's media, add it
  if (post.mediaUrl && post.mediaType) {
    body.specificContent = {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: post.text,
        },
        shareMediaCategory: post.mediaType,
        media: [
          {
            status: 'READY',
            originalUrl: post.mediaUrl,
          },
        ],
      },
    };
  }

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create LinkedIn post: ${error}`);
  }

  const postId = response.headers.get('x-restli-id') || '';
  
  return {
    id: postId,
    url: `https://www.linkedin.com/feed/update/${postId}`,
  };
}

/**
 * Upload image to LinkedIn
 */
export async function uploadLinkedInImage(
  accessToken: string,
  userId: string,
  imageUrl: string
): Promise<string> {
  // Step 1: Register the upload
  const registerResponse = await fetch(
    `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${userId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      }),
    }
  );

  if (!registerResponse.ok) {
    throw new Error('Failed to register LinkedIn image upload');
  }

  const registerData = await registerResponse.json();
  const uploadUrl = registerData.value.uploadMechanism[
    'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
  ].uploadUrl;
  const asset = registerData.value.asset;

  // Step 2: Download the image
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  // Step 3: Upload the image
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'image/jpeg',
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to LinkedIn');
  }

  return asset;
}


