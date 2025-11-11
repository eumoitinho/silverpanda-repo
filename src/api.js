// API utility functions for Spotify and SoundCloud

const API_BASE = '/api';

export class SpotifyAPI {
  static async getArtist() {
    try {
      const response = await fetch(`${API_BASE}/spotify/artist`);
      if (!response.ok) throw new Error('Failed to fetch artist');
      return await response.json();
    } catch (error) {
      console.error('Error fetching artist:', error);
      throw error;
    }
  }

  static async getTopTracks(market = 'US') {
    try {
      const response = await fetch(`${API_BASE}/spotify/artist-tracks?market=${market}`);
      if (!response.ok) throw new Error('Failed to fetch tracks');
      const data = await response.json();
      return data.tracks || [];
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw error;
    }
  }

  static async getTracksByIds(ids = []) {
    const validIds = ids
      .flatMap((id) => (typeof id === 'string' ? id.split(',') : []))
      .map((id) => id.trim())
      .filter(Boolean);

    if (!validIds.length) {
      return [];
    }

    const params = new URLSearchParams();
    validIds.forEach((id) => params.append('ids', id));

    const query = params.toString();

    try {
      const response = await fetch(`${API_BASE}/spotify/artist-tracks?${query}`);
      if (!response.ok) throw new Error('Failed to fetch Spotify tracks by IDs');
      const data = await response.json();
      return data.tracks || [];
    } catch (error) {
      console.error('Error fetching Spotify tracks by IDs:', error);
      throw error;
    }
  }

  static async getAlbums(limit = 50, offset = 0) {
    try {
      const response = await fetch(`${API_BASE}/spotify/albums?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch albums');
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching albums:', error);
      throw error;
    }
  }

  static async getAlbumsFormatted(limit = 50) {
    try {
      const response = await fetch(`${API_BASE}/spotify/albums?limit=${limit}&offset=0`);
      if (!response.ok) {
        console.warn('Failed to fetch albums from API, will try JSON fallback');
        return [];
      }
      const data = await response.json();
      const albums = data.items || [];
      
      const formatted = albums.map((album) => {
        // Pegar a maior imagem disponível (geralmente a primeira é a maior)
        const artwork = album.images && album.images.length > 0 
          ? album.images[0].url 
          : null;
        
        console.log(`[SpotifyAPI] Album: ${album.name}, Artwork: ${artwork ? '✅' : '❌'}`);
        
        return {
          id: album.id,
          name: album.name,
          artist: album.artists?.[0]?.name || 'Silver Panda',
          releaseDate: album.release_date || '',
          artwork: artwork,
          externalUrl: album.external_urls?.spotify || null,
          totalTracks: album.total_tracks || 0,
          provider: 'spotify',
        };
      });
      
      console.log(`[SpotifyAPI] Formatted ${formatted.length} albums`);
      return formatted;
    } catch (error) {
      console.error('Error fetching formatted albums:', error);
      return [];
    }
  }
}

export class SoundCloudAPI {
  static async getUser() {
    try {
      const response = await fetch(`${API_BASE}/soundcloud/user`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return await response.json();
    } catch (error) {
      console.error('Error fetching SoundCloud user:', error);
      throw error;
    }
  }

  static async getTracks(userId = null, limit = 50) {
    try {
      const url = userId
        ? `${API_BASE}/soundcloud/tracks?user_id=${userId}&limit=${limit}`
        : `${API_BASE}/soundcloud/tracks?limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tracks');
      const data = await response.json();
      return data.tracks || [];
    } catch (error) {
      console.error('Error fetching SoundCloud tracks:', error);
      throw error;
    }
  }

  static async getTracksByIdentifiers({ ids = [], urls = [] } = {}) {
    const params = new URLSearchParams();

    ids
      .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((id) => params.append('ids', id));

    urls
      .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((url) => params.append('urls', url));

    const query = params.toString();

    if (!query) {
      return [];
    }

    try {
      const response = await fetch(`${API_BASE}/soundcloud/tracks?${query}`);
      if (!response.ok) throw new Error('Failed to fetch SoundCloud tracks');
      const data = await response.json();
      return data.tracks || [];
    } catch (error) {
      console.error('Error fetching SoundCloud tracks by identifiers:', error);
      throw error;
    }
  }
}

// Format duration from milliseconds to MM:SS
export function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format number with K/M suffixes
export function formatNumber(num) {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// Format release date
export function formatReleaseDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

