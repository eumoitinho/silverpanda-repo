// Script para buscar álbuns do Spotify e salvar em JSON
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const ARTIST_ID = '310IX3ZzFSl14ZvY2dM8Da';

async function getAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function getAlbums(token) {
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${ARTIST_ID}/albums?include_groups=album,single&market=US&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch albums');
  }

  const data = await response.json();
  return data.items || [];
}

async function main() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in environment');
    process.exit(1);
  }

  try {
    console.log('Fetching access token...');
    const token = await getAccessToken();

    console.log('Fetching albums...');
    const albums = await getAlbums(token);

    const formattedAlbums = albums.map((album) => ({
      id: album.id,
      name: album.name,
      artist: album.artists?.[0]?.name || 'Silver Panda',
      releaseDate: album.release_date || '',
      artwork: album.images?.[0]?.url || null,
      externalUrl: album.external_urls?.spotify || null,
      totalTracks: album.total_tracks || 0,
    }));

    const output = {
      albums: formattedAlbums,
      tracks: [],
      lastUpdated: new Date().toISOString(),
    };

    const outputPath = join(__dirname, '../public/music/albums.json');
    writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Saved ${formattedAlbums.length} albums to ${outputPath}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

