const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

type SpotifyTokenCache = {
  token: string | null;
  expiresAt: number;
};

interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
}

interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  name: string;
  release_date: string;
  images: Array<{ url: string }>;
}

interface SpotifyTrackResponse {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
}

interface SpotifyTopTracksResponse {
  tracks: SpotifyTrackResponse[];
}

const tokenCache: SpotifyTokenCache = {
  token: null,
  expiresAt: 0,
};

async function getAccessToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.warn('[spotify] Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in Strapi environment.');
    return null;
  }

  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[spotify] Failed to obtain access token:', text);
      return null;
    }

    const data = (await response.json()) as SpotifyTokenResponse;
    tokenCache.token = data.access_token;
    tokenCache.expiresAt = Date.now() + data.expires_in * 1000;
    return tokenCache.token;
  } catch (error) {
    console.error('[spotify] Error fetching access token:', error);
    return null;
  }
}

export type SpotifyTrackData = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number | null;
  releaseDate: string | null;
  artwork: string | null;
  externalUrl: string | null;
  previewUrl: string | null;
};

export async function fetchSpotifyTrack(trackId: string): Promise<SpotifyTrackData | null> {
  if (!trackId) return null;
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${encodeURIComponent(trackId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[spotify] Failed to fetch track ${trackId}:`, text);
      return null;
    }

    const data = (await response.json()) as SpotifyTrackResponse;

    return {
      id: data.id,
      title: data.name,
      artist: data.artists?.[0]?.name || '',
      album: data.album?.name || '',
      duration: typeof data.duration_ms === 'number' ? data.duration_ms : null,
      releaseDate: data.album?.release_date || null,
      artwork: data.album?.images?.[0]?.url || null,
      externalUrl: data.external_urls?.spotify || null,
      previewUrl: data.preview_url || null,
    };
  } catch (error) {
    console.error(`[spotify] Error fetching track ${trackId}:`, error);
    return null;
  }
}

const SILVER_PANDA_ARTIST_ID = '310IX3ZzFSl14ZvY2dM8Da';

export async function getTopTracks(limit = 50): Promise<SpotifyTrackData[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${SILVER_PANDA_ARTIST_ID}/top-tracks?market=US`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('[spotify] Failed to fetch top tracks:', text);
      return [];
    }

    const data = (await response.json()) as SpotifyTopTracksResponse;
    const tracks = (data.tracks || []).slice(0, limit);

    return tracks.map((track: SpotifyTrackResponse) => ({
      id: track.id,
      title: track.name,
      artist: track.artists?.[0]?.name || '',
      album: track.album?.name || '',
      duration: typeof track.duration_ms === 'number' ? track.duration_ms : null,
      releaseDate: track.album?.release_date || null,
      artwork: track.album?.images?.[0]?.url || null,
      externalUrl: track.external_urls?.spotify || null,
      previewUrl: track.preview_url || null,
    }));
  } catch (error) {
    console.error('[spotify] Error fetching top tracks:', error);
    return [];
  }
}

