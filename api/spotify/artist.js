// Silver Panda Artist ID
const ARTIST_ID = '310IX3ZzFSl14ZvY2dM8Da';

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
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(200).json({
        id: ARTIST_ID,
        name: 'Silver Panda',
        images: [],
        followers: { total: 2034205 },
        genres: ['melodic techno', 'techno', 'house'],
        external_urls: {
          spotify: `https://open.spotify.com/artist/${ARTIST_ID}`,
        },
        popularity: 65,
      });
    }

    // Get access token
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
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Get artist info
    const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${ARTIST_ID}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!artistResponse.ok) {
      throw new Error('Failed to fetch artist');
    }

    const data = await artistResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching artist:', error);
    return res.status(200).json({
      id: ARTIST_ID,
      name: 'Silver Panda',
      images: [],
      followers: { total: 2034205 },
      genres: ['melodic techno', 'techno', 'house'],
      external_urls: {
        spotify: `https://open.spotify.com/artist/${ARTIST_ID}`,
      },
      popularity: 65,
    });
  }
}
