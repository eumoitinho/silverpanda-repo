const SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;

export type SoundcloudTrackData = {
  id: string;
  title: string;
  artist: string;
  label: string | null;
  duration: number | null;
  releaseDate: string | null;
  artwork: string | null;
  permalinkUrl: string | null;
};

interface SoundcloudUser {
  id: number;
  username: string;
  avatar_url?: string;
}

interface SoundcloudTrackResponse {
  id: number;
  title: string;
  user: SoundcloudUser;
  label_name?: string;
  duration: number;
  release_date?: string;
  created_at?: string;
  artwork_url?: string;
  permalink_url?: string;
  kind?: string;
}

interface SoundcloudUserResponse {
  id: number;
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SoundCloud request failed (${response.status}): ${text}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchSoundcloudTrackById(trackId: string): Promise<SoundcloudTrackData | null> {
  if (!SOUNDCLOUD_CLIENT_ID) {
    console.warn('[soundcloud] Missing SOUNDCLOUD_CLIENT_ID in Strapi environment.');
    return null;
  }

  if (!trackId) return null;

  try {
    const data = await fetchJson<SoundcloudTrackResponse>(`https://api.soundcloud.com/tracks/${trackId}?client_id=${SOUNDCLOUD_CLIENT_ID}`);
    return mapSoundcloudTrack(data);
  } catch (error) {
    console.error(`[soundcloud] Error fetching track by ID (${trackId}):`, error);
    return null;
  }
}

export async function resolveSoundcloudTrack(permalinkUrl: string): Promise<SoundcloudTrackData | null> {
  if (!SOUNDCLOUD_CLIENT_ID) {
    console.warn('[soundcloud] Missing SOUNDCLOUD_CLIENT_ID in Strapi environment.');
    return null;
  }

  if (!permalinkUrl) return null;

  try {
    const data = await fetchJson<SoundcloudTrackResponse | SoundcloudTrackResponse[]>(
      `https://api.soundcloud.com/resolve?url=${encodeURIComponent(permalinkUrl)}&client_id=${SOUNDCLOUD_CLIENT_ID}`,
    );

    if (Array.isArray(data)) {
      const track = data.find((item) => item?.kind === 'track');
      return track ? mapSoundcloudTrack(track) : null;
    }

    if (data && typeof data === 'object' && 'kind' in data && data.kind === 'track') {
      return mapSoundcloudTrack(data);
    }

    return null;
  } catch (error) {
    console.error(`[soundcloud] Error resolving URL (${permalinkUrl}):`, error);
    return null;
  }
}

function mapSoundcloudTrack(track: SoundcloudTrackResponse | null | undefined): SoundcloudTrackData | null {
  if (!track) return null;
  return {
    id: track.id ? String(track.id) : '',
    title: track.title || '',
    artist: track.user?.username || '',
    label: track.label_name || null,
    duration: typeof track.duration === 'number' ? track.duration : null,
    releaseDate: track.release_date || track.created_at || null,
    artwork: track.artwork_url || track.user?.avatar_url || null,
    permalinkUrl: track.permalink_url || null,
  };
}

export async function getTopTracks(limit = 50): Promise<SoundcloudTrackData[]> {
  if (!SOUNDCLOUD_CLIENT_ID) {
    console.warn('[soundcloud] Missing SOUNDCLOUD_CLIENT_ID in Strapi environment.');
    return [];
  }

  try {
    // Search for Silver Panda user
    const searchResponse = await fetch(
      `https://api.soundcloud.com/users?q=silver+panda&client_id=${SOUNDCLOUD_CLIENT_ID}&limit=1`
    );

    if (!searchResponse.ok) {
      console.error('[soundcloud] Failed to search user');
      return [];
    }

    const users = (await searchResponse.json()) as SoundcloudUserResponse[];
    if (!Array.isArray(users) || users.length === 0) {
      return [];
    }

    const userId = users[0].id;
    const tracksResponse = await fetch(
      `https://api.soundcloud.com/users/${userId}/tracks?client_id=${SOUNDCLOUD_CLIENT_ID}&limit=${limit}`
    );

    if (!tracksResponse.ok) {
      console.error('[soundcloud] Failed to fetch user tracks');
      return [];
    }

    const tracks = (await tracksResponse.json()) as SoundcloudTrackResponse[];
    if (!Array.isArray(tracks)) {
      return [];
    }

    return tracks.slice(0, limit).map(mapSoundcloudTrack).filter(Boolean) as SoundcloudTrackData[];
  } catch (error) {
    console.error('[soundcloud] Error fetching top tracks:', error);
    return [];
  }
}

