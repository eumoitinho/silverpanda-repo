const STRAPI_BASE_URL = (import.meta.env.VITE_STRAPI_BASE_URL || '').replace(/\/$/, '');
const STRAPI_API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN || '';

const getSearchParams = () => {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
};

const SEARCH_PARAMS = getSearchParams();
const PREVIEW_MODE = SEARCH_PARAMS.get('preview') === 'true';
const PREVIEW_DOCUMENT_ID = SEARCH_PARAMS.get('documentId') || undefined;
const PREVIEW_STATUS = SEARCH_PARAMS.get('status') || undefined;
const PREVIEW_LOCALE = SEARCH_PARAMS.get('locale') || undefined;
const STRAPI_PUBLICATION_STATE = PREVIEW_MODE
  ? 'preview'
  : (import.meta.env.VITE_STRAPI_PUBLICATION_STATE || 'live').toLowerCase();

const DEFAULT_HERO = {
  title: 'Silver Panda',
  subtitle: 'Melodic Techno Duo',
  metaTitle: 'Silver Panda',
  heroBackground: '',
  heroLogo: '',
  background: '',
  logo: '',
};

const DEFAULT_TOURS = {
  source: 'Resident Advisor',
  items: [
    { id: 'tour-2025-11-15', date: '2025-11-15', city: 'Barcelona', country: 'Spain', venue: 'Parc Del Forum', link: '' },
    { id: 'tour-2025-10-17', date: '2025-10-17', city: 'Miami, FL', country: 'USA', venue: 'III Points Music Festival', link: '' },
    { id: 'tour-2025-10-12', date: '2025-10-12', city: 'Ibiza', country: 'Spain', venue: '[UNVRS] Closing Party', link: '' },
    { id: 'tour-2025-10-05', date: '2025-10-05', city: 'Paris', country: 'France', venue: 'Brunch Electronik', link: '' },
    { id: 'tour-2025-09-21', date: '2025-09-21', city: 'San Francisco, CA', country: 'USA', venue: '888 Garage', link: '' },
    { id: 'tour-2025-09-20', date: '2025-09-20', city: 'Chicago, IL', country: 'USA', venue: 'Western Lot', link: '' },
    { id: 'tour-2025-09-19', date: '2025-09-19', city: 'Montreal', country: 'Canada', venue: 'Off Piknic', link: '' },
    { id: 'tour-2025-08-17', date: '2025-08-17', city: 'Zeebrugge', country: 'Belgium', venue: 'WECANDANCE', link: '' },
    { id: 'tour-2025-08-16', date: '2025-08-16', city: 'Poznan', country: 'Poland', venue: 'BitterSweet Festival', link: '' },
    { id: 'tour-2025-08-15', date: '2025-08-15', city: 'Puglia', country: 'Italy', venue: 'Panorama Festival', link: '' },
  ],
};

const DEFAULT_VIDEOS = [];

const DEFAULT_PRESS = [];

const DEFAULT_INFO = {
  image: '/photos/photo2.png',
  paragraphs: [
    'In an impressively short time, Silver Panda has garnered support from some of the biggest names in the industry, catapulting their profile to epic heights. Their collaborative work with artists like John Summit, Space Motion, and Sevenn has led to significant achievements, including their music reaching the #1 spot on Beatport\'s Overall Chart.',
    'In 2024, Silver Panda achieved a major milestone with the #1 top-selling melodic techno track on Beatport and claimed the #1 spot for track support in 2024 via 1001Tracklists stats. Their innovative sound has earned them a place among Beatport\'s top 10 melodic techno artists, fueling a world tour across the US, South America, Europe, and Asia.',
    'In addition to their creative output, Silver Panda has shaped the industry with their label, Panda Lab Records. The label rose to become the #4 melodic techno label on the Beatport charts in 2023, highlighting the duo\'s exceptional blend of creativity, collaboration, and entrepreneurship.',
  ],
  contact: [
    { label: 'Management', link: 'mailto:management@silvpanda.com', value: 'management@silvpanda.com' },
    { label: 'Bookings', link: 'mailto:bookings@silvpanda.com', value: 'bookings@silvpanda.com' },
  ],
  credit: 'Design by ANGELO',
};

const DEFAULT_SPOTIFY_TRACKS = [];
const DEFAULT_SOUNDCLOUD_TRACKS = [];
const DEFAULT_INSTAGRAM_POSTS = [];

function unwrapEntry(entry) {
  if (!entry) return {};
  const base = entry.attributes ? entry.attributes : entry;
  return {
    ...base,
    id: entry.id ?? base.id,
    documentId: entry.documentId ?? base.documentId,
  };
}

function unwrapData(data) {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.map(unwrapEntry);
  }
  return unwrapEntry(data);
}

function buildAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (!STRAPI_BASE_URL) return path;
  return `${STRAPI_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function normaliseCredits(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split('\n').map(entry => entry.trim()).filter(Boolean);
  }
  return [];
}

export class StrapiCMS {
  static isConfigured() {
    return Boolean(STRAPI_BASE_URL);
  }

  static getDefaultHero() {
    return { ...DEFAULT_HERO, isFallback: true };
  }

  static getDefaultTours() {
    return { ...DEFAULT_TOURS, items: [...DEFAULT_TOURS.items] };
  }

  static getDefaultVideos() {
    return DEFAULT_VIDEOS.map(video => ({ ...video }));
  }

  static getDefaultPress() {
    return DEFAULT_PRESS.map(feature => ({ ...feature }));
  }

  static getDefaultInfo() {
    return {
      ...DEFAULT_INFO,
      paragraphs: [...DEFAULT_INFO.paragraphs],
      contact: DEFAULT_INFO.contact.map(entry => ({ ...entry })),
    };
  }

  static getDefaultSpotifyTracks() {
    return DEFAULT_SPOTIFY_TRACKS.map(track => ({ ...track }));
  }

  static getDefaultSoundcloudTracks() {
    return DEFAULT_SOUNDCLOUD_TRACKS.map(track => ({ ...track }));
  }

  static getDefaultInstagramPosts() {
    return DEFAULT_INSTAGRAM_POSTS.map(post => ({ ...post }));
  }

  static async fetchAPI(endpoint, params = {}) {
    if (!this.isConfigured()) {
      throw new Error('Strapi base URL not configured');
    }

    const url = new URL(`/api/${endpoint}`, STRAPI_BASE_URL);

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach(item => url.searchParams.append(key, item));
      } else {
        url.searchParams.append(key, value);
      }
    });

    if (!url.searchParams.has('publicationState') && STRAPI_PUBLICATION_STATE && STRAPI_PUBLICATION_STATE !== 'live') {
      url.searchParams.append('publicationState', STRAPI_PUBLICATION_STATE);
    }

    const headers = { 'Content-Type': 'application/json' };
    if (STRAPI_API_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
    }
    if (PREVIEW_MODE) {
      headers['strapi-encode-source-maps'] = 'true';
    }

    const response = await fetch(url.toString(), { headers });
    if (response.status === 204) {
      return { data: null, meta: {} };
    }

    if (!response.ok) {
      throw new Error(`Strapi request failed: ${response.status}`);
    }

    return response.json();
  }

  static async getHomepageHero() {
    if (!this.isConfigured()) return this.getDefaultHero();

    try {
      const params = { populate: ['heroBackground', 'heroLogo'] };

      if (PREVIEW_MODE && PREVIEW_DOCUMENT_ID) {
        params.documentId = PREVIEW_DOCUMENT_ID;
        params.status = PREVIEW_STATUS || 'draft';
        if (PREVIEW_LOCALE) {
          params.locale = PREVIEW_LOCALE;
        }
      }

      const data = await this.fetchAPI('homepage', params);
      const homepage = unwrapData(data?.data) || {};
      return this.formatHero(homepage);
    } catch (error) {
      console.error('Error fetching Strapi homepage hero:', error);
      return this.getDefaultHero();
    }
  }

  static async getMusicPage() {
    const fallback = {
      spotifyTracks: this.getDefaultSpotifyTracks(),
      soundcloudTracks: this.getDefaultSoundcloudTracks(),
    };

    if (!this.isConfigured()) {
      return fallback;
    }

    try {
      const params = {
        populate: ['spotifyTracks.manualArtwork', 'soundcloudTracks.manualArtwork'],
      };

      if (PREVIEW_MODE && PREVIEW_DOCUMENT_ID) {
        params.documentId = PREVIEW_DOCUMENT_ID;
        params.status = PREVIEW_STATUS || 'draft';
        if (PREVIEW_LOCALE) {
          params.locale = PREVIEW_LOCALE;
        }
      }

      const data = await this.fetchAPI('music-page', params);
      const entry = unwrapData(data?.data) || {};

      return {
        spotifyTracks: this.formatSpotifySelection(entry.spotifyTracks),
        soundcloudTracks: this.formatSoundcloudSelection(entry.soundcloudTracks),
      };
    } catch (error) {
      console.error('Error fetching Strapi music page:', error);
      return fallback;
    }
  }

  static async getCollaborationsPage() {
    const fallback = {
      instagramPosts: this.getDefaultInstagramPosts(),
    };

    if (!this.isConfigured()) {
      return fallback;
    }

    try {
      const params = {
        populate: ['instagramPosts.media'],
      };

      if (PREVIEW_MODE && PREVIEW_DOCUMENT_ID) {
        params.documentId = PREVIEW_DOCUMENT_ID;
        params.status = PREVIEW_STATUS || 'draft';
        if (PREVIEW_LOCALE) {
          params.locale = PREVIEW_LOCALE;
        }
      }

      const data = await this.fetchAPI('collaborations-page', params);
      const entry = unwrapData(data?.data) || {};

      return {
        instagramPosts: this.formatInstagramPosts(entry.instagramPosts),
      };
    } catch (error) {
      console.error('Error fetching Strapi collaborations page:', error);
      return fallback;
    }
  }

  static formatHero(homepage = {}) {
    const backgroundData =
      homepage.heroBackground?.data?.attributes ||
      homepage.heroBackground?.attributes ||
      homepage.heroBackground;
    const logoData =
      homepage.heroLogo?.data?.attributes ||
      homepage.heroLogo?.attributes ||
      homepage.heroLogo;

    const heroBackground = buildAssetUrl(backgroundData?.url) || '';
    const heroLogo = buildAssetUrl(logoData?.url) || '';
    const hasTitle = typeof homepage.title === 'string' && homepage.title.trim().length > 0;
    const hasSubtitle = typeof homepage.subtitle === 'string' && homepage.subtitle.trim().length > 0;

    if (!hasTitle && !hasSubtitle && !heroBackground && !heroLogo) {
      return this.getDefaultHero();
    }

    const metaTitle =
      typeof homepage.metaTitle === 'string' && homepage.metaTitle.trim().length > 0
        ? homepage.metaTitle
        : hasTitle
          ? homepage.title
          : DEFAULT_HERO.metaTitle || DEFAULT_HERO.title;

    return {
      title: hasTitle ? homepage.title : null,
      subtitle: hasSubtitle ? homepage.subtitle : null,
      metaTitle,
      heroBackground,
      heroLogo,
      background: heroBackground,
      logo: heroLogo,
      isFallback: false,
    };
  }

  static formatSpotifySelection(entries = []) {
    if (!Array.isArray(entries) || !entries.length) {
      return this.getDefaultSpotifyTracks();
    }

    const formatted = entries
      .map(entry => {
        const item = unwrapEntry(entry);
        const artworkData =
          item.manualArtwork?.data?.attributes ||
          item.manualArtwork?.attributes ||
          item.manualArtwork;

        const manualArtwork = buildAssetUrl(artworkData?.url);
        const manualArtworkUrl = item.manualArtworkUrl || '';

        const manual = {
          title: item.manualTitle || '',
          artist: item.manualArtist || '',
          album: item.manualAlbum || '',
          duration: typeof item.manualDuration === 'number' ? item.manualDuration : null,
          releaseDate: item.manualReleaseDate || null,
          artwork: manualArtwork || manualArtworkUrl || '',
          externalUrl: item.manualExternalUrl || '',
          previewUrl: item.manualPreviewUrl || '',
        };

        const trackId = typeof item.trackId === 'string' && item.trackId.trim().length > 0
          ? item.trackId.trim()
          : null;

        return {
          id: item.id,
          trackId,
          manual,
          notes: item.notes || '',
        };
      })
      .filter(item => item.trackId || item.manual.title || item.manual.artist || item.manual.externalUrl);

    return formatted.length ? formatted : this.getDefaultSpotifyTracks();
  }

  static formatSoundcloudSelection(entries = []) {
    if (!Array.isArray(entries) || !entries.length) {
      return this.getDefaultSoundcloudTracks();
    }

    const formatted = entries
      .map(entry => {
        const item = unwrapEntry(entry);
        const artworkData =
          item.manualArtwork?.data?.attributes ||
          item.manualArtwork?.attributes ||
          item.manualArtwork;

        const manualArtwork = buildAssetUrl(artworkData?.url);
        const manualArtworkUrl = item.manualArtworkUrl || '';

        const manual = {
          title: item.manualTitle || '',
          artist: item.manualArtist || '',
          label: item.manualLabel || '',
          releaseDate: item.manualReleaseDate || null,
          duration: typeof item.manualDuration === 'number' ? item.manualDuration : null,
          artwork: manualArtwork || manualArtworkUrl || '',
          externalUrl: item.manualExternalUrl || item.permalinkUrl || '',
        };

        const trackId = typeof item.trackId === 'string' && item.trackId.trim().length > 0
          ? item.trackId.trim()
          : null;
        const permalinkUrl = typeof item.permalinkUrl === 'string' && item.permalinkUrl.trim().length > 0
          ? item.permalinkUrl.trim()
          : '';

        return {
          id: item.id,
          trackId,
          permalinkUrl,
          manual,
          notes: item.notes || '',
        };
      })
      .filter(item => item.trackId || item.permalinkUrl || item.manual.title || item.manual.artist);

    return formatted.length ? formatted : this.getDefaultSoundcloudTracks();
  }

  static formatInstagramPosts(entries = []) {
    if (!Array.isArray(entries) || !entries.length) {
      return this.getDefaultInstagramPosts();
    }

    const formatted = entries
      .map(entry => {
        const item = unwrapEntry(entry);
        const mediaAttributes =
          item.media?.data?.attributes ||
          item.media?.attributes ||
          item.media;

        const mediaUrl = item.mediaUrl || buildAssetUrl(mediaAttributes?.url);
        const altText = mediaAttributes?.alternativeText || '';

        if (!mediaUrl && !item.permalink) {
          return null;
        }

        return {
          id: item.id,
          permalink: item.permalink || '',
          caption: item.caption || '',
          timestamp: item.timestamp || null,
          likes: typeof item.likes === 'number' ? item.likes : null,
          comments: typeof item.comments === 'number' ? item.comments : null,
          mediaType: item.mediaType || 'image',
          mediaUrl,
          altText,
          notes: item.notes || '',
        };
      })
      .filter(Boolean);

    return formatted.length ? formatted : this.getDefaultInstagramPosts();
  }

  static async getTours() {
    if (!this.isConfigured()) return this.getDefaultTours();

    try {
      const data = await this.fetchAPI('tour-dates', { sort: 'date:asc' });
      const items = (unwrapData(data?.data) || []).map(attributes => {
        return {
          id: attributes.id || attributes.slug || attributes.title,
          date: attributes.date,
          city: attributes.city,
          country: attributes.country,
          venue: attributes.venue,
          link: attributes.link || attributes.ticketUrl || attributes.externalUrl,
        };
      }).filter(item => item.date || item.city || item.venue);

      return {
        source: data?.meta?.source || DEFAULT_TOURS.source,
        items: items.length ? items : [...DEFAULT_TOURS.items],
      };
    } catch (error) {
      console.error('Error fetching Strapi tour dates:', error);
      return this.getDefaultTours();
    }
  }

  static async getVideos() {
    if (!this.isConfigured()) return this.getDefaultVideos();

    try {
      const data = await this.fetchAPI('videos', { populate: 'thumbnail', sort: 'order:asc' });
      const videos = (unwrapData(data?.data) || []).map(attributes => {
        const thumbnailData = attributes.thumbnail?.data?.attributes || attributes.thumbnail?.attributes || attributes.thumbnail;
        const thumbnail = thumbnailData?.url || attributes.thumbnailUrl;

        return {
          id: attributes.id,
          title: attributes.title || attributes.name,
          year: attributes.year || attributes.releaseYear,
          thumbnail: buildAssetUrl(thumbnail),
          credits: normaliseCredits(attributes.credits),
          youtubeId: attributes.youtubeId || attributes.youtubeUrl,
          category: attributes.category || 'Music Videos',
          releaseDate: attributes.releaseDate,
        };
      }).filter(video => video.youtubeId);

      return videos.length ? videos : this.getDefaultVideos();
    } catch (error) {
      console.error('Error fetching Strapi videos:', error);
      return this.getDefaultVideos();
    }
  }

  static async getPress() {
    if (!this.isConfigured()) return this.getDefaultPress();

    try {
      const data = await this.fetchAPI('press-features', { populate: 'cover', sort: 'publishedAt:desc' });
      const press = (unwrapData(data?.data) || []).map(attributes => {
        const coverData = attributes.cover?.data?.attributes || attributes.cover?.attributes || attributes.cover;
        const image = coverData?.url || attributes.imageUrl;
        return {
          id: attributes.id,
          publication: attributes.publication || attributes.title,
          title: attributes.title,
          date: attributes.date || attributes.publishedAt,
          image: buildAssetUrl(image),
          link: attributes.link || attributes.articleUrl,
        };
      }).filter(feature => feature.publication || feature.title);

      return press.length ? press : this.getDefaultPress();
    } catch (error) {
      console.error('Error fetching Strapi press features:', error);
      return this.getDefaultPress();
    }
  }

  static async getInfo() {
    if (!this.isConfigured()) return this.getDefaultInfo();

    try {
      const data = await this.fetchAPI('about', { populate: 'image' });
      const attributes = unwrapData(data?.data) || {};
      const imageData = attributes.image?.data?.attributes || attributes.image?.attributes || attributes.image;
      const image = imageData?.url || attributes.imageUrl;
      
      // Construir paragraphs a partir dos campos paragraph1, paragraph2, paragraph3
      const paragraphs = [];
      if (attributes.paragraph1) paragraphs.push(attributes.paragraph1);
      if (attributes.paragraph2) paragraphs.push(attributes.paragraph2);
      if (attributes.paragraph3) paragraphs.push(attributes.paragraph3);
      
      // Se não houver paragraphs individuais, usar description
      if (paragraphs.length === 0 && attributes.description) {
        paragraphs.push(...attributes.description.split('\n\n').filter(Boolean));
      }

      // Construir contact links
      const contactEntries = [];
      if (attributes.contactManagement || attributes.contactManagementLink) {
        contactEntries.push({
          label: 'Management',
          value: attributes.contactManagement,
          link: attributes.contactManagementLink || (attributes.contactManagement && attributes.contactManagement.includes('@') ? `mailto:${attributes.contactManagement}` : attributes.contactManagement),
        });
      }
      if (attributes.contactBookings || attributes.contactBookingsLink) {
        contactEntries.push({
          label: 'Bookings',
          value: attributes.contactBookings,
          link: attributes.contactBookingsLink || (attributes.contactBookings && attributes.contactBookings.includes('@') ? `mailto:${attributes.contactBookings}` : attributes.contactBookings),
        });
      }

      return {
        image: buildAssetUrl(image) || DEFAULT_INFO.image,
        paragraphs: paragraphs.length ? paragraphs : [...DEFAULT_INFO.paragraphs],
        contact: contactEntries.length ? contactEntries : DEFAULT_INFO.contact.map(entry => ({ ...entry })),
        credit: attributes.credit || DEFAULT_INFO.credit,
      };
    } catch (error) {
      console.error('Error fetching Strapi about section:', error);
      return this.getDefaultInfo();
    }
  }
}

