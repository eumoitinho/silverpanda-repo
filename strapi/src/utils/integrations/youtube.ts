const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export type YouTubeVideoData = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  thumbnailHigh: string | null;
  duration: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  tags: string[];
};

interface YouTubeVideoSnippet {
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
    maxres?: { url: string };
  };
  tags?: string[];
}

interface YouTubeVideoStatistics {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
}

interface YouTubeVideoContentDetails {
  duration?: string;
}

interface YouTubeVideoResponse {
  id: string;
  snippet: YouTubeVideoSnippet;
  statistics?: YouTubeVideoStatistics;
  contentDetails?: YouTubeVideoContentDetails;
}

interface YouTubeSearchItem {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: YouTubeVideoSnippet;
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

interface YouTubeVideosResponse {
  items: YouTubeVideoResponse[];
}

export async function fetchYouTubeVideo(videoId: string): Promise<YouTubeVideoData | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn('[youtube] Missing YOUTUBE_API_KEY in Strapi environment.');
    return null;
  }

  if (!videoId) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}&part=snippet,statistics,contentDetails&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(`[youtube] Failed to fetch video ${videoId}:`, text);
      return null;
    }

    const data = (await response.json()) as YouTubeVideosResponse;

    if (!data.items || data.items.length === 0) {
      console.warn(`[youtube] Video ${videoId} not found`);
      return null;
    }

    const video = data.items[0];

    return {
      id: video.id,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      channelTitle: video.snippet?.channelTitle || '',
      publishedAt: video.snippet?.publishedAt || null,
      thumbnailUrl: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || null,
      thumbnailHigh: video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || null,
      duration: video.contentDetails?.duration || null,
      viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount, 10) : null,
      likeCount: video.statistics?.likeCount ? parseInt(video.statistics.likeCount, 10) : null,
      commentCount: video.statistics?.commentCount ? parseInt(video.statistics.commentCount, 10) : null,
      tags: video.snippet?.tags || [],
    };
  } catch (error) {
    console.error(`[youtube] Error fetching video ${videoId}:`, error);
    return null;
  }
}

export async function extractVideoIdFromUrl(url: string): Promise<string | null> {
  if (!url) return null;

  // Já é um ID (11 caracteres alfanuméricos)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // URL patterns do YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export async function searchChannelVideos(channelId: string, maxResults = 50): Promise<YouTubeVideoData[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('[youtube] Missing YOUTUBE_API_KEY in Strapi environment.');
    return [];
  }

  try {
    // Buscar vídeos do canal
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?channelId=${encodeURIComponent(channelId)}&part=snippet&type=video&order=date&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    );

    if (!searchResponse.ok) {
      const text = await searchResponse.text();
      console.error('[youtube] Failed to search channel videos:', text);
      return [];
    }

    const searchData = (await searchResponse.json()) as YouTubeSearchResponse;

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Buscar detalhes de todos os vídeos
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoIds}&part=snippet,statistics,contentDetails&key=${YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      const text = await videosResponse.text();
      console.error('[youtube] Failed to fetch video details:', text);
      return [];
    }

    const videosData = (await videosResponse.json()) as YouTubeVideosResponse;

    return videosData.items.map(video => ({
      id: video.id,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      channelTitle: video.snippet?.channelTitle || '',
      publishedAt: video.snippet?.publishedAt || null,
      thumbnailUrl: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || null,
      thumbnailHigh: video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || null,
      duration: video.contentDetails?.duration || null,
      viewCount: video.statistics?.viewCount ? parseInt(video.statistics.viewCount, 10) : null,
      likeCount: video.statistics?.likeCount ? parseInt(video.statistics.likeCount, 10) : null,
      commentCount: video.statistics?.commentCount ? parseInt(video.statistics.commentCount, 10) : null,
      tags: video.snippet?.tags || [],
    }));
  } catch (error) {
    console.error('[youtube] Error searching channel videos:', error);
    return [];
  }
}
