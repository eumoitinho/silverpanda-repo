// Spotify Search API endpoint
import dotenv from 'dotenv';
dotenv.config();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getAccessToken() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to get access token:', text);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { q, type = 'track', limit = 10 } = req.query;

  if (!q) {
    res.status(400).json({ error: 'Missing query parameter "q"' });
    return;
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      res.status(500).json({ error: 'Failed to get Spotify access token' });
      return;
    }

    const searchParams = new URLSearchParams({
      q: q,
      type: type,
      limit: String(limit),
    });

    const response = await fetch(
      `https://api.spotify.com/v1/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Spotify search failed:', text);
      res.status(response.status).json({ error: 'Spotify search failed' });
      return;
    }

    const data = await response.json();
    const tracks = (data.tracks?.items || []).map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists?.[0]?.name || '',
      album: track.album?.name || '',
      artwork: track.album?.images?.[0]?.url || null,
      externalUrl: track.external_urls?.spotify || null,
      previewUrl: track.preview_url || null,
      duration: track.duration_ms || null,
    }));

    res.status(200).json({ tracks });
  } catch (error) {
    console.error('Error searching Spotify:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

