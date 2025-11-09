# Silver Panda Website

A modern, minimalist website for Silver Panda with Spotify and SoundCloud integration, built with Vite and deployed on Vercel.

## Features

- **Homepage** with animated glowing circle effect
- **Music Section** with dynamic Spotify integration showing top tracks
- **Tour Section** with upcoming dates and venues
- **Videos Section** with music videos
- **Press Section** with magazine covers and CMS-driven metadata
- **Info/Biography Section** with artist information
- **CMS-curated Music & Social** — selecione faixas do Spotify/SoundCloud e posts do Instagram diretamente pelo Strapi
- **Responsive Design** for mobile and desktop
- **Smooth Navigation** with single-page app behavior
- **Spotify API Integration** - Fetches real-time top tracks
- **SoundCloud API Integration** - Ready for SoundCloud tracks
- **Strapi CMS (optional)** - Manage hero text, tour dates, videos, press, and bio content

## Tech Stack

- **Vite** - Build tool and dev server
- **Vanilla JavaScript** (ES6 Modules)
- **CSS3** - Modern styling with animations
- **Vercel** - Hosting and serverless functions
- **Spotify API** - Music data
- **SoundCloud API** - Additional music platform support
- **Strapi** - Headless CMS for marketing content

## Project Structure

```
silverpanda-repo/
├── api/                          # Vercel serverless functions
│   ├── spotify/
│   │   ├── artist.js
│   │   ├── artist-tracks.js
│   │   └── albums.js
│   └── soundcloud/
│       ├── user.js
│       └── tracks.js
├── src/                          # Frontend source code
│   ├── api.js                    # API utilities
│   ├── cms.js                    # Strapi CMS integration
│   ├── main.js                   # Main application logic
│   ├── preview.js                # Strapi preview integration
│   └── styles/
│       └── main.css              # Main stylesheet
├── public/                     # Static assets
│   ├── music/
│   ├── videos/
│   ├── press/
│   └── info/
├── strapi/                       # Strapi CMS backend
│   ├── src/
│   │   ├── api/                  # Content types
│   │   ├── components/            # Reusable components
│   │   ├── plugins/              # Custom plugins (track-selector)
│   │   └── utils/                # Utilities (Spotify/SoundCloud)
│   ├── config/                   # Strapi configuration
│   └── package.json
├── scripts/                      # Setup and utility scripts
├── index.html                    # Main HTML file
├── vite.config.js                # Vite configuration
├── vercel.json                   # Vercel configuration
└── package.json                  # Frontend dependencies
```

## Setup

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (Vite requires the `VITE_` prefix for client-side variables):
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SOUNDCLOUD_CLIENT_ID=your_soundcloud_client_id_here
VITE_STRAPI_BASE_URL=https://your-strapi-domain.com
VITE_STRAPI_API_TOKEN=your_strapi_api_token
VITE_STRAPI_PUBLICATION_STATE=live
```

3. Run the development server:
```bash
npm run dev
```

The site will be available at `http://localhost:3000`

### Getting API Credentials

#### Spotify API
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy the Client ID and Client Secret
4. Add your redirect URI (for production: your Vercel URL)

#### SoundCloud API
1. Go to [SoundCloud Developers](https://developers.soundcloud.com/)
2. Register your app
3. Get your Client ID

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository on Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_STRAPI_BASE_URL`
   - `VITE_STRAPI_API_TOKEN`
- `VITE_STRAPI_PUBLICATION_STATE`
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SOUNDCLOUD_CLIENT_ID`
4. Deploy!

Vercel will automatically:
- Build the project with Vite
- Deploy serverless functions from the `api/` directory
- Serve the static site

## API Endpoints

### Spotify
- `GET /api/spotify/artist` - Get artist information
- `GET /api/spotify/artist-tracks?market=US` - Get top tracks
- `GET /api/spotify/albums?limit=50&offset=0` - Get albums

### SoundCloud
- `GET /api/soundcloud/user` - Get user information
- `GET /api/soundcloud/tracks?user_id=XXX&limit=50` - Get tracks

## Environment Variables

| Variable | Description | Required | Scope |
|----------|-------------|----------|-------|
| `SPOTIFY_CLIENT_ID` | Spotify API Client ID | Yes | Serverless functions |
| `SPOTIFY_CLIENT_SECRET` | Spotify API Client Secret | Yes | Serverless functions |
| `SOUNDCLOUD_CLIENT_ID` | SoundCloud API Client ID | Optional | Serverless functions |
| `VITE_STRAPI_BASE_URL` | Public Strapi REST URL (e.g. `https://cms.example.com`) | Optional | Client |
| `VITE_STRAPI_API_TOKEN` | Strapi API token (with read permissions) | Optional | Client |
| `VITE_STRAPI_PUBLICATION_STATE` | `live` (default) or `preview` to view draft content/live editing | Optional | Client |
| `CLIENT_URL` | Frontend URL used by Strapi Preview (e.g. `http://localhost:3000`) | Optional | Strapi |
| `PREVIEW_URL` | URL opened by Strapi Preview (defaults to `CLIENT_URL`) | Optional | Strapi |
| `PREVIEW_SECRET` | Optional shared secret for preview links | Optional | Strapi |

> Para que o Strapi preencha automaticamente os cards de Spotify e SoundCloud, configure `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` e `SOUNDCLOUD_CLIENT_ID` também no arquivo `strapi/.env`.

## Strapi CMS (Optional)

The website can consume content from a Strapi instance. Suggested content-types:

- **Single Type:** `homepage`
  - Campos: `title`, `subtitle`, `metaTitle`, `heroLogo`, `heroBackground`
- **Single Type:** `music-page`
  - Componentes repeatables: `spotifyTracks`, `soundcloudTracks`
  - Informe apenas o `trackId` do Spotify (ou `permalinkUrl`/`trackId` do SoundCloud); ao salvar, o Strapi busca na API oficial e preenche automaticamente título, artista, álbum, duração, data, links e preview. Os campos continuam editáveis caso queira sobrescrever.
- **Single Type:** `collaborations-page`
  - Componentes repeatables: `instagramPosts`
  - Defina o `permalink` e a mídia (upload ou URL); os demais campos (caption, likes, comments) são opcionais e servem como override.
- **Collection Type:** `tour-dates`
  - Fields: `date` (Date), `city`, `country`, `venue`, `link`
- **Collection Type:** `videos`
  - Fields: `title`, `youtubeId` or `youtubeUrl`, `year`, `category`
  - Media: `thumbnail`
  - Optional: `credits` (text area or repeatable component)
- **Collection Type:** `press-features`
  - Fields: `publication`, `title`, `date`, `link`
  - Media: `cover`
- **Single Type:** `about`
  - Media: `image`
  - Text fields: `paragraph1`, `paragraph2`, `paragraph3`
  - Contact fields: `contactManagement`, `contactBookings` (+ optional link fields)
  - Optional: `credit`

Grant the read-only token access to the relevant content-types and add the credentials as environment variables.

### Preview & Live Editing

1. In Strapi, add the following variables to `.env`:
   - `CLIENT_URL=http://localhost:3000`
   - `PREVIEW_URL=http://localhost:3000`
   - `PREVIEW_SECRET=your_preview_secret` (optional but recommended)
2. Ensure the `preview` feature is enabled (see `strapi/config/admin.ts`).
3. In the Strapi Content Manager, open any entry and click **Open preview** to launch the front-end in preview mode.
4. When the preview opens inside Strapi, the site automatically sends the `previewReady` message so Live Preview can inject editing overlays. Draft changes are fetched using `publicationState=preview` and `strapi-encode-source-maps` headers.
5. To disable preview mode, remove the query parameters (or set `VITE_STRAPI_PUBLICATION_STATE=live` in your front-end environment).

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is for educational purposes only.

## Silver Panda

- [Spotify](https://open.spotify.com/artist/310IX3ZzFSl14ZvY2dM8Da)
- Artist ID: `310IX3ZzFSl14ZvY2dM8Da`
