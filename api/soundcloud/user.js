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
    const clientId = process.env.SOUNDCLOUD_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({ error: 'SoundCloud client ID not configured' });
    }

    // Search for Silver Panda on SoundCloud
    const searchResponse = await fetch(
      `https://api.soundcloud.com/users?q=silver+panda&client_id=${clientId}&limit=1`
    );

    if (!searchResponse.ok) {
      throw new Error(`SoundCloud API error: ${searchResponse.status}`);
    }

    const users = await searchResponse.json();

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(users[0]);
  } catch (error) {
    console.error('Error fetching SoundCloud user:', error);
    return res.status(500).json({ error: error.message });
  }
}
