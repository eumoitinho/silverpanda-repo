const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

export type InstagramPostData = {
  id: string;
  permalink: string;
  caption: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  timestamp: string | null;
  username: string | null;
  likeCount: number | null;
  commentsCount: number | null;
};

interface InstagramMediaResponse {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramMediaListResponse {
  data: InstagramMediaResponse[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
}

export async function fetchInstagramPost(postId: string): Promise<InstagramPostData | null> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.warn('[instagram] Missing INSTAGRAM_ACCESS_TOKEN in Strapi environment.');
    return null;
  }

  if (!postId) return null;

  try {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count';
    const response = await fetch(
      `https://graph.instagram.com/${encodeURIComponent(postId)}?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[instagram] Failed to fetch post ${postId}:`, text);
      return null;
    }

    const data = (await response.json()) as InstagramMediaResponse;

    return {
      id: data.id,
      permalink: data.permalink,
      caption: data.caption || null,
      mediaType: data.media_type,
      mediaUrl: data.media_url || null,
      thumbnailUrl: data.thumbnail_url || null,
      timestamp: data.timestamp || null,
      username: data.username || null,
      likeCount: data.like_count || null,
      commentsCount: data.comments_count || null,
    };
  } catch (error) {
    console.error(`[instagram] Error fetching post ${postId}:`, error);
    return null;
  }
}

export async function extractPostIdFromUrl(url: string): Promise<string | null> {
  if (!url) return null;

  // Já é um ID numérico
  if (/^\d+$/.test(url)) {
    return url;
  }

  // URL patterns do Instagram
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Se encontrou um shortcode, precisa converter para ID usando a API
      // Por enquanto, retorna o shortcode - o permalink será usado
      return match[1];
    }
  }

  return null;
}

export async function getUserMedia(limit = 50): Promise<InstagramPostData[]> {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    console.warn('[instagram] Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID in Strapi environment.');
    return [];
  }

  try {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count';
    const response = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('[instagram] Failed to fetch user media:', text);
      return [];
    }

    const data = (await response.json()) as InstagramMediaListResponse;

    if (!data.data || data.data.length === 0) {
      return [];
    }

    return data.data.map(post => ({
      id: post.id,
      permalink: post.permalink,
      caption: post.caption || null,
      mediaType: post.media_type,
      mediaUrl: post.media_url || null,
      thumbnailUrl: post.thumbnail_url || null,
      timestamp: post.timestamp || null,
      username: post.username || null,
      likeCount: post.like_count || null,
      commentsCount: post.comments_count || null,
    }));
  } catch (error) {
    console.error('[instagram] Error fetching user media:', error);
    return [];
  }
}

export async function getRecentMedia(limit = 25): Promise<InstagramPostData[]> {
  return getUserMedia(limit);
}
