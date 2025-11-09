import { fetchSpotifyTrack } from '../../../../utils/integrations/spotify';
import { fetchSoundcloudTrackById, resolveSoundcloudTrack } from '../../../../utils/integrations/soundcloud';

type ComponentEntry = Record<string, any>;

function cloneComponent(entry: ComponentEntry): ComponentEntry {
  if (!entry || typeof entry !== 'object') return entry;
  return { ...entry };
}

async function createSpotifyComponentsFromIds(trackIds: string[]): Promise<ComponentEntry[]> {
  if (!Array.isArray(trackIds) || trackIds.length === 0) return [];

  const components = await Promise.all(
    trackIds
      .filter((id) => id && typeof id === 'string' && id.trim().length > 0) // Filter out invalid IDs
      .map(async (trackId) => {
        const cleanTrackId = String(trackId).trim();
        const data = await fetchSpotifyTrack(cleanTrackId);
        if (!data) {
          return {
            trackId: cleanTrackId,
            manualTitle: '',
            manualArtist: '',
            manualAlbum: '',
            manualDuration: null,
            manualReleaseDate: null,
            manualExternalUrl: `https://open.spotify.com/track/${cleanTrackId}`,
            manualPreviewUrl: null,
            manualArtworkUrl: null,
          };
        }

        // Ensure all values are primitives
        const component: any = {
          trackId: String(data.id || cleanTrackId),
          manualTitle: String(data.title || ''),
          manualArtist: String(data.artist || ''),
          manualAlbum: String(data.album || ''),
          manualDuration: typeof data.duration === 'number' ? data.duration : null,
          manualExternalUrl: String(data.externalUrl || `https://open.spotify.com/track/${data.id || cleanTrackId}`),
          manualPreviewUrl: data.previewUrl ? String(data.previewUrl) : null,
          manualArtworkUrl: data.artwork ? String(data.artwork) : null,
        };
        
        // Handle date field - only set if it's a valid date string
        if (data.releaseDate) {
          const dateStr = String(data.releaseDate);
          // Validate it's a date string format (YYYY-MM-DD or ISO format)
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}/) || !isNaN(Date.parse(dateStr))) {
            component.manualReleaseDate = dateStr;
          } else {
            component.manualReleaseDate = null;
          }
        } else {
          component.manualReleaseDate = null;
        }
        
        return component;
      })
  );

  return components.filter(Boolean);
}

async function createSoundcloudComponentsFromIds(trackIds: string[]): Promise<ComponentEntry[]> {
  if (!Array.isArray(trackIds) || trackIds.length === 0) return [];

  const components = await Promise.all(
    trackIds
      .filter((id) => id && (typeof id === 'string' || typeof id === 'number')) // Filter out invalid IDs
      .map(async (trackId) => {
        const cleanTrackId = String(trackId).trim();
        const data = await fetchSoundcloudTrackById(cleanTrackId);
        if (!data) {
          return {
            trackId: cleanTrackId,
            permalinkUrl: '',
            manualTitle: '',
            manualArtist: '',
            manualLabel: '',
            manualDuration: null,
            manualReleaseDate: null,
            manualExternalUrl: '',
            manualArtworkUrl: null,
          };
        }

        // Ensure all values are primitives
        const component: any = {
          trackId: String(data.id || cleanTrackId),
          permalinkUrl: String(data.permalinkUrl || ''),
          manualTitle: String(data.title || ''),
          manualArtist: String(data.artist || ''),
          manualLabel: String(data.label || ''),
          manualDuration: typeof data.duration === 'number' ? data.duration : null,
          manualExternalUrl: String(data.permalinkUrl || ''),
          manualArtworkUrl: data.artwork ? String(data.artwork) : null,
        };
        
        // Handle date field - only set if it's a valid date string
        if (data.releaseDate) {
          const dateStr = String(data.releaseDate);
          // Validate it's a date string format (YYYY-MM-DD or ISO format)
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}/) || !isNaN(Date.parse(dateStr))) {
            component.manualReleaseDate = dateStr;
          } else {
            component.manualReleaseDate = null;
          }
        } else {
          component.manualReleaseDate = null;
        }
        
        return component;
      })
  );

  return components.filter(Boolean);
}

function shouldPopulateSpotify(entry: ComponentEntry): boolean {
  if (!entry) return false;
  const manual = [
    entry.manualTitle,
    entry.manualArtist,
    entry.manualAlbum,
    entry.manualExternalUrl,
    entry.manualPreviewUrl,
  ];
  return manual.some((value) => !value);
}

function shouldPopulateSoundcloud(entry: ComponentEntry): boolean {
  if (!entry) return false;
  const manual = [
    entry.manualTitle,
    entry.manualArtist,
    entry.manualLabel,
    entry.manualExternalUrl,
  ];
  return manual.some((value) => !value);
}

async function populateSpotifyComponents(entries: ComponentEntry[]): Promise<ComponentEntry[]> {
  if (!Array.isArray(entries)) return entries;

  return Promise.all(
    entries.map(async (rawEntry) => {
      const entry = cloneComponent(rawEntry);
      const trackId = typeof entry.trackId === 'string' ? entry.trackId.trim() : '';
      if (!trackId || !shouldPopulateSpotify(entry)) {
        return entry;
      }

      const data = await fetchSpotifyTrack(trackId);
      if (!data) {
        return entry;
      }

      if (!entry.manualTitle && data.title) entry.manualTitle = data.title;
      if (!entry.manualArtist && data.artist) entry.manualArtist = data.artist;
      if (!entry.manualAlbum && data.album) entry.manualAlbum = data.album;
      if (!entry.manualDuration && data.duration) entry.manualDuration = data.duration;
      if (!entry.manualReleaseDate && data.releaseDate) entry.manualReleaseDate = data.releaseDate;
      if (!entry.manualExternalUrl && data.externalUrl) entry.manualExternalUrl = data.externalUrl;
      if (!entry.manualPreviewUrl && data.previewUrl) entry.manualPreviewUrl = data.previewUrl;
      if (!entry.manualArtworkUrl && data.artwork) entry.manualArtworkUrl = data.artwork;

      return entry;
    }),
  );
}

async function populateSoundcloudComponents(entries: ComponentEntry[]): Promise<ComponentEntry[]> {
  if (!Array.isArray(entries)) return entries;

  return Promise.all(
    entries.map(async (rawEntry) => {
      const entry = cloneComponent(rawEntry);
      if (!shouldPopulateSoundcloud(entry)) {
        return entry;
      }

      const trackId = typeof entry.trackId === 'string' ? entry.trackId.trim() : '';
      const permalinkUrl = typeof entry.permalinkUrl === 'string' ? entry.permalinkUrl.trim() : '';

      let data = null;
      if (trackId) {
        data = await fetchSoundcloudTrackById(trackId);
      }
      if (!data && permalinkUrl) {
        data = await resolveSoundcloudTrack(permalinkUrl);
      }

      if (!data) {
        return entry;
      }

      if (!entry.trackId && data.id) entry.trackId = data.id;
      if (!entry.permalinkUrl && data.permalinkUrl) entry.permalinkUrl = data.permalinkUrl;
      if (!entry.manualTitle && data.title) entry.manualTitle = data.title;
      if (!entry.manualArtist && data.artist) entry.manualArtist = data.artist;
      if (!entry.manualLabel && data.label) entry.manualLabel = data.label;
      if (!entry.manualDuration && data.duration) entry.manualDuration = data.duration;
      if (!entry.manualReleaseDate && data.releaseDate) entry.manualReleaseDate = data.releaseDate;
      if (!entry.manualExternalUrl && data.permalinkUrl) entry.manualExternalUrl = data.permalinkUrl;
      if (!entry.manualArtworkUrl && data.artwork) entry.manualArtworkUrl = data.artwork;

      return entry;
    }),
  );
}

export async function populateMusicPage(data: Record<string, any>, skipLifecycle = false) {
  if (!data || typeof data !== 'object') return;

  // Remove system fields and existing components - they cause errors
  delete data.spotifyTracks;
  delete data.soundcloudTracks;
  delete data.publishedAt;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.id;
  delete data.documentId;
  delete data.createdBy;
  delete data.updatedBy;
  
  // If skipLifecycle is true, we're being called manually and should not trigger lifecycle
  if (skipLifecycle) {
    // Just create components without modifying data structure
  }

  console.log('[music-page lifecycle] populateMusicPage called with:', {
    hasSelectedSpotify: Array.isArray(data.selectedSpotifyTrackIds) && data.selectedSpotifyTrackIds.length > 0,
    hasSelectedSoundcloud: Array.isArray(data.selectedSoundcloudTrackIds) && data.selectedSoundcloudTrackIds.length > 0,
    keys: Object.keys(data),
  });

  try {
    // Se houver IDs selecionados, criar componentes a partir deles
    if (data.selectedSpotifyTrackIds && Array.isArray(data.selectedSpotifyTrackIds) && data.selectedSpotifyTrackIds.length > 0) {
      try {
        console.log('[music-page lifecycle] Creating Spotify components from', data.selectedSpotifyTrackIds.length, 'IDs');
        const newComponents = await createSpotifyComponentsFromIds(data.selectedSpotifyTrackIds);
        console.log('[music-page lifecycle] Fetched', newComponents.length, 'components from API');
        
        // Criar componentes usando a API do Strapi para garantir formato correto
        const componentEntries = newComponents.map((comp: any, index: number) => {
          const entry: any = {};
          // Apenas campos permitidos no schema - converter tudo para primitivos
          if (comp.trackId !== undefined) entry.trackId = String(comp.trackId || '');
          if (comp.manualTitle !== undefined) entry.manualTitle = String(comp.manualTitle || '');
          if (comp.manualArtist !== undefined) entry.manualArtist = String(comp.manualArtist || '');
          if (comp.manualAlbum !== undefined) entry.manualAlbum = String(comp.manualAlbum || '');
          if (comp.manualDuration !== undefined && comp.manualDuration !== null) {
            entry.manualDuration = typeof comp.manualDuration === 'number' ? comp.manualDuration : Number(comp.manualDuration);
          }
          if (comp.manualReleaseDate !== undefined && comp.manualReleaseDate !== null) {
            entry.manualReleaseDate = String(comp.manualReleaseDate);
          }
          if (comp.manualExternalUrl !== undefined) entry.manualExternalUrl = String(comp.manualExternalUrl || '');
          if (comp.manualPreviewUrl !== undefined && comp.manualPreviewUrl !== null) {
            entry.manualPreviewUrl = String(comp.manualPreviewUrl);
          }
          if (comp.manualArtworkUrl !== undefined && comp.manualArtworkUrl !== null) {
            entry.manualArtworkUrl = String(comp.manualArtworkUrl);
          }
          
          // Validate entry has no objects
          const hasObjects = Object.values(entry).some((v: any) => v !== null && typeof v === 'object');
          if (hasObjects) {
            console.error('[music-page lifecycle] Component', index, 'has objects!', entry);
            // Remove objects
            Object.keys(entry).forEach((key) => {
              if (entry[key] !== null && typeof entry[key] === 'object') {
                delete entry[key];
              }
            });
          }
          
          return entry;
        });
        
        console.log('[music-page lifecycle] Created', componentEntries.length, 'Spotify component entries');
        if (componentEntries.length > 0) {
          console.log('[music-page lifecycle] First entry:', JSON.stringify(componentEntries[0], null, 2));
        }
        
        // Final validation - ensure all entries are clean
        const finalEntries = componentEntries.map((entry: any) => {
          const clean: any = {};
          Object.keys(entry).forEach((key) => {
            const value = entry[key];
            if (value === null || value === undefined) {
              clean[key] = null;
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              clean[key] = value;
            } else {
              console.error('[music-page lifecycle] Found non-primitive in final validation:', key, typeof value, value);
            }
          });
          return clean;
        });
        
        // Log final structure before assigning
        console.log('[music-page lifecycle] Final entries structure:', JSON.stringify(finalEntries.slice(0, 1), null, 2));
        
        // Deep clone and ensure everything is a primitive - no references
        const serializedEntries = JSON.parse(JSON.stringify(finalEntries));
        
        // Verify serialization worked (should remove any hidden objects)
        // For repeatable components, just pass plain objects - no __component needed
        const verifiedEntries = serializedEntries.map((entry: any) => {
          const verified: any = {};
          Object.keys(entry).forEach((key) => {
            const value = entry[key];
            if (value === null || value === undefined) {
              verified[key] = null;
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              verified[key] = value;
            } else {
              console.error('[music-page lifecycle] After serialization, found non-primitive:', key, typeof value, value);
            }
          });
          return verified;
        });
        
        console.log('[music-page lifecycle] Verified entries count:', verifiedEntries.length);
        data.spotifyTracks = verifiedEntries;
      } catch (error) {
        console.error('[music-page lifecycle] Error creating Spotify components:', error);
      }
    } else if (Array.isArray(data.spotifyTracks)) {
      try {
        data.spotifyTracks = await populateSpotifyComponents(data.spotifyTracks);
      } catch (error) {
        console.error('[music-page lifecycle] Error populating Spotify components:', error);
      }
    }

    if (data.selectedSoundcloudTrackIds && Array.isArray(data.selectedSoundcloudTrackIds) && data.selectedSoundcloudTrackIds.length > 0) {
      try {
        const newComponents = await createSoundcloudComponentsFromIds(data.selectedSoundcloudTrackIds);
        
        // Criar componentes usando a API do Strapi para garantir formato correto
        const componentEntries = newComponents.map((comp: any) => {
          const entry: any = {};
          // Apenas campos permitidos no schema
          if (comp.trackId !== undefined) entry.trackId = String(comp.trackId || '');
          if (comp.permalinkUrl !== undefined) entry.permalinkUrl = String(comp.permalinkUrl || '');
          if (comp.manualTitle !== undefined) entry.manualTitle = String(comp.manualTitle || '');
          if (comp.manualArtist !== undefined) entry.manualArtist = String(comp.manualArtist || '');
          if (comp.manualLabel !== undefined) entry.manualLabel = String(comp.manualLabel || '');
          if (comp.manualDuration !== undefined && comp.manualDuration !== null) entry.manualDuration = Number(comp.manualDuration);
          if (comp.manualReleaseDate !== undefined && comp.manualReleaseDate !== null) entry.manualReleaseDate = String(comp.manualReleaseDate);
          if (comp.manualExternalUrl !== undefined) entry.manualExternalUrl = String(comp.manualExternalUrl || '');
          if (comp.manualArtworkUrl !== undefined && comp.manualArtworkUrl !== null) entry.manualArtworkUrl = String(comp.manualArtworkUrl);
          return entry;
        });
        
        // Deep clone and ensure everything is a primitive - no references
        const serializedEntries = JSON.parse(JSON.stringify(componentEntries));
        
        // Verify serialization worked
        // For repeatable components, just pass plain objects - no __component needed
        const verifiedEntries = serializedEntries.map((entry: any) => {
          const verified: any = {};
          Object.keys(entry).forEach((key) => {
            const value = entry[key];
            if (value === null || value === undefined) {
              verified[key] = null;
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              verified[key] = value;
            } else {
              console.error('[music-page lifecycle] SoundCloud: After serialization, found non-primitive:', key, typeof value, value);
            }
          });
          return verified;
        });
        
        data.soundcloudTracks = verifiedEntries;
      } catch (error) {
        console.error('[music-page lifecycle] Error creating SoundCloud components:', error);
      }
    } else if (Array.isArray(data.soundcloudTracks)) {
      try {
        data.soundcloudTracks = await populateSoundcloudComponents(data.soundcloudTracks);
      } catch (error) {
        console.error('[music-page lifecycle] Error populating SoundCloud components:', error);
      }
    }
  } catch (error) {
    console.error('[music-page lifecycle] Error in populateMusicPage:', error);
  }
}

export default {
  // Lifecycle disabled - components are created manually in controller
  // async beforeCreate(event: { params: { data: Record<string, any> } }) {
  //   await populateMusicPage(event.params?.data);
  // },
  // async beforeUpdate(event: { params: { data: Record<string, any> } }) {
  //   await populateMusicPage(event.params?.data);
  // },
};

