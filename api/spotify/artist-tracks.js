// Silver Panda Artist ID
const ARTIST_ID = '310IX3ZzFSl14ZvY2dM8Da';

// Fallback tracks in case the API fails
const FALLBACK_TRACKS = [
  {
    id: '1',
    title: 'Take No More',
    artist: 'Silver Panda',
    artwork: 'https://i.scdn.co/image/ab67616d0000b273placeholder',
    duration: 240000,
    externalUrl: 'https://open.spotify.com/track/placeholder1',
    album: 'Take No More - Single',
    releaseDate: '2025-01-01',
    popularity: 50,
    previewUrl: null,
  },
  {
    id: '2',
    title: 'Lift Me Up',
    artist: 'Silver Panda',
    artwork: 'https://i.scdn.co/image/ab67616d0000b273placeholder',
    duration: 220000,
    externalUrl: 'https://open.spotify.com/track/placeholder2',
    album: 'Lift Me Up - Single',
    releaseDate: '2025-01-01',
    popularity: 48,
    previewUrl: null,
  },
];

function mapSpotifyTrack(track) {
  if (!track) return null;
  return {
    id: track.id,
    title: track.name,
    artist: track.artists?.[0]?.name || 'Unknown Artist',
    artwork: track.album?.images?.[0]?.url || '/placeholder-album.jpg',
    duration: track.duration_ms,
    externalUrl: track.external_urls?.spotify || '',
    album: track.album?.name || '',
    releaseDate: track.album?.release_date || '',
    popularity: track.popularity ?? null,
    previewUrl: track.preview_url,
  };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching artist tracks for Silver Panda');

    // Get access token via Client Credentials Flow
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials');
      console.log('Returning fallback tracks');
      return res.status(200).json({ tracks: FALLBACK_TRACKS });
    }

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Failed to obtain token:', errorData);
      console.log('Returning fallback tracks');
      return res.status(200).json({ tracks: FALLBACK_TRACKS });
    }

    const { access_token } = await tokenResponse.json();
    console.log('Successfully obtained access token');

    const idsParam = req.query?.ids;
    const requestedIds = [];
    const pushId = (value) => {
      if (typeof value !== 'string') return;
      value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .forEach((id) => {
          if (!requestedIds.includes(id)) {
            requestedIds.push(id);
          }
        });
    };

    if (Array.isArray(idsParam)) {
      idsParam.forEach(pushId);
    } else if (typeof idsParam === 'string') {
      pushId(idsParam);
    }

    if (requestedIds.length > 0) {
      console.log(`Fetching Spotify tracks by IDs: ${requestedIds.join(', ')}`);
      const fetchedTracks = [];
      const chunkSize = 50;

      for (let i = 0; i < requestedIds.length; i += chunkSize) {
        const chunk = requestedIds.slice(i, i + chunkSize);
        const chunkUrl = `https://api.spotify.com/v1/tracks?ids=${chunk.join(',')}`;
        const chunkResponse = await fetch(chunkUrl, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!chunkResponse.ok) {
          const errorText = await chunkResponse.text();
          console.error(`Spotify tracks by IDs error (${chunkResponse.status}):`, errorText);
          continue;
        }

        const chunkData = await chunkResponse.json();
        if (Array.isArray(chunkData.tracks)) {
          chunkData.tracks.forEach((track) => {
            if (track && track.id) {
              fetchedTracks.push(track);
            }
          });
        }
      }

      const trackMap = new Map(fetchedTracks.map((track) => [track.id, track]));
      const orderedTracks = requestedIds
        .map((id) => mapSpotifyTrack(trackMap.get(id)))
        .filter(Boolean);

      if (!orderedTracks.length) {
        console.warn('No Spotify tracks returned for requested IDs. Falling back to defaults.');
        return res.status(200).json({ tracks: FALLBACK_TRACKS });
      }

      return res.status(200).json({ tracks: orderedTracks });
    }

    // Get top tracks if no IDs provided
    const market = req.query?.market || 'US';
    console.log(`Fetching top tracks for artist ID: ${ARTIST_ID}`);
    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/artists/${ARTIST_ID}/top-tracks?market=${market}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!tracksResponse.ok) {
      const errorData = await tracksResponse.json();
      console.error('Spotify API error:', errorData);
      console.log('Returning fallback tracks');
      return res.status(200).json({ tracks: FALLBACK_TRACKS });
    }

    const data = await tracksResponse.json();
    console.log(`Successfully fetched ${data.tracks?.length || 0} top tracks`);

    const tracks = (data.tracks || []).map(mapSpotifyTrack).filter(Boolean);

    return res.status(200).json({ tracks: tracks.length ? tracks : FALLBACK_TRACKS });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    console.log('Returning fallback tracks due to error');
    return res.status(200).json({ tracks: FALLBACK_TRACKS });
  }
}
