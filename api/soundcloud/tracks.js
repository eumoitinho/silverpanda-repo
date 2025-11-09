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
    let userId = req.query?.user_id;
    const limit = req.query?.limit || 50;

    if (!clientId) {
      return res.status(500).json({ error: 'SoundCloud client ID not configured' });
    }

    const parseList = (param) => {
      if (!param) return [];
      const values = Array.isArray(param) ? param : [param];
      const results = [];
      values.forEach((value) => {
        if (typeof value !== 'string') return;
        value
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
          .forEach((entry) => {
            if (!results.includes(entry)) {
              results.push(entry);
            }
          });
      });
      return results;
    };

    const requestedIds = parseList(req.query?.ids);
    const requestedUrls = parseList(req.query?.urls);

    if (requestedIds.length || requestedUrls.length) {
      const results = [];
      const seenIds = new Set();

      const pushTrack = (track) => {
        if (!track) return;
        const trackId = track.id ? String(track.id) : null;
        if (trackId && seenIds.has(trackId)) return;
        if (trackId) {
          seenIds.add(trackId);
        }
        results.push(track);
      };

      for (const id of requestedIds) {
        try {
          const trackResponse = await fetch(`https://api.soundcloud.com/tracks/${id}?client_id=${clientId}`);
          if (!trackResponse.ok) {
            console.error(`SoundCloud track by ID error (${id}): ${trackResponse.status}`);
            continue;
          }
          const track = await trackResponse.json();
          pushTrack(track);
        } catch (trackError) {
          console.error(`Error fetching SoundCloud track by ID (${id}):`, trackError);
        }
      }

      for (const url of requestedUrls) {
        try {
          const resolveResponse = await fetch(
            `https://api.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`
          );

          if (!resolveResponse.ok) {
            console.error(`SoundCloud resolve error (${url}): ${resolveResponse.status}`);
            continue;
          }

          const resolved = await resolveResponse.json();
          if (resolved?.kind === 'track') {
            pushTrack(resolved);
          } else if (Array.isArray(resolved)) {
            resolved.forEach(pushTrack);
          }
        } catch (resolveError) {
          console.error(`Error resolving SoundCloud URL (${url}):`, resolveError);
        }
      }

      return res.status(200).json({ tracks: results });
    }

    if (!userId) {
      // First, search for the user
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

      userId = users[0].id;
    }

    const tracksResponse = await fetch(
      `https://api.soundcloud.com/users/${userId}/tracks?client_id=${clientId}&limit=${limit}`
    );

    if (!tracksResponse.ok) {
      throw new Error(`SoundCloud API error: ${tracksResponse.status}`);
    }

    const tracks = await tracksResponse.json();
    return res.status(200).json({ tracks });
  } catch (error) {
    console.error('Error fetching SoundCloud tracks:', error);
    return res.status(500).json({ error: error.message });
  }
}
