import { fetchYouTubeVideo, extractVideoIdFromUrl } from '../../../../utils/integrations/youtube';

type ComponentEntry = Record<string, any>;

function cloneComponent(entry: ComponentEntry): ComponentEntry {
  if (!entry || typeof entry !== 'object') return entry;
  return { ...entry };
}

async function createYouTubeComponentsFromIds(videoIds: string[]): Promise<ComponentEntry[]> {
  if (!Array.isArray(videoIds) || videoIds.length === 0) return [];

  const components = await Promise.all(
    videoIds
      .filter((id) => id && typeof id === 'string' && id.trim().length > 0)
      .map(async (videoIdOrUrl) => {
        const cleanInput = String(videoIdOrUrl).trim();

        // Extrair ID da URL se necessário
        const videoId = await extractVideoIdFromUrl(cleanInput);

        if (!videoId) {
          return {
            videoId: cleanInput,
            youtubeUrl: '',
            manualTitle: '',
            manualDescription: '',
            manualChannelTitle: '',
            manualPublishedAt: null,
            manualThumbnailUrl: null,
            manualDuration: null,
            manualViewCount: null,
            manualLikeCount: null,
            manualTags: null,
            category: 'Music Videos',
          };
        }

        const data = await fetchYouTubeVideo(videoId);

        if (!data) {
          return {
            videoId,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
            manualTitle: '',
            manualDescription: '',
            manualChannelTitle: '',
            manualPublishedAt: null,
            manualThumbnailUrl: null,
            manualDuration: null,
            manualViewCount: null,
            manualLikeCount: null,
            manualTags: null,
            category: 'Music Videos',
          };
        }

        const component: any = {
          videoId: String(data.id || videoId),
          youtubeUrl: `https://www.youtube.com/watch?v=${data.id || videoId}`,
          manualTitle: String(data.title || ''),
          manualDescription: String(data.description || ''),
          manualChannelTitle: String(data.channelTitle || ''),
          manualThumbnailUrl: data.thumbnailUrl ? String(data.thumbnailUrl) : null,
          manualDuration: data.duration ? String(data.duration) : null,
          manualViewCount: typeof data.viewCount === 'number' ? data.viewCount : null,
          manualLikeCount: typeof data.likeCount === 'number' ? data.likeCount : null,
          manualTags: data.tags && data.tags.length > 0 ? data.tags : null,
          category: 'Music Videos',
        };

        // Handle datetime field
        if (data.publishedAt) {
          const dateStr = String(data.publishedAt);
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}/) || !isNaN(Date.parse(dateStr))) {
            component.manualPublishedAt = dateStr;
          } else {
            component.manualPublishedAt = null;
          }
        } else {
          component.manualPublishedAt = null;
        }

        return component;
      })
  );

  return components.filter(Boolean);
}

function shouldPopulateYouTube(entry: ComponentEntry): boolean {
  if (!entry) return false;
  const manual = [
    entry.manualTitle,
    entry.manualDescription,
    entry.manualThumbnailUrl,
  ];
  return manual.some((value) => !value);
}

async function populateYouTubeComponents(entries: ComponentEntry[]): Promise<ComponentEntry[]> {
  if (!Array.isArray(entries)) return entries;

  return Promise.all(
    entries.map(async (rawEntry) => {
      const entry = cloneComponent(rawEntry);

      if (!shouldPopulateYouTube(entry)) {
        return entry;
      }

      let videoId = typeof entry.videoId === 'string' ? entry.videoId.trim() : '';

      // Se não tem videoId mas tem URL, extrair
      if (!videoId && entry.youtubeUrl) {
        videoId = await extractVideoIdFromUrl(entry.youtubeUrl) || '';
      }

      if (!videoId) {
        return entry;
      }

      const data = await fetchYouTubeVideo(videoId);
      if (!data) {
        return entry;
      }

      if (!entry.videoId && data.id) entry.videoId = data.id;
      if (!entry.youtubeUrl) entry.youtubeUrl = `https://www.youtube.com/watch?v=${data.id}`;
      if (!entry.manualTitle && data.title) entry.manualTitle = data.title;
      if (!entry.manualDescription && data.description) entry.manualDescription = data.description;
      if (!entry.manualChannelTitle && data.channelTitle) entry.manualChannelTitle = data.channelTitle;
      if (!entry.manualPublishedAt && data.publishedAt) entry.manualPublishedAt = data.publishedAt;
      if (!entry.manualThumbnailUrl && data.thumbnailUrl) entry.manualThumbnailUrl = data.thumbnailUrl;
      if (!entry.manualDuration && data.duration) entry.manualDuration = data.duration;
      if (!entry.manualViewCount && data.viewCount) entry.manualViewCount = data.viewCount;
      if (!entry.manualLikeCount && data.likeCount) entry.manualLikeCount = data.likeCount;
      if (!entry.manualTags && data.tags && data.tags.length > 0) entry.manualTags = data.tags;

      return entry;
    }),
  );
}

export async function populateVideosPage(data: Record<string, any>, skipLifecycle = false) {
  if (!data || typeof data !== 'object') return;

  // Remove system fields and existing components
  delete data.youtubeVideos;
  delete data.publishedAt;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.id;
  delete data.documentId;
  delete data.createdBy;
  delete data.updatedBy;

  console.log('[videos-page lifecycle] populateVideosPage called with:', {
    hasSelectedYouTube: Array.isArray(data.selectedYouTubeVideoIds) && data.selectedYouTubeVideoIds.length > 0,
    keys: Object.keys(data),
  });

  try {
    if (data.selectedYouTubeVideoIds && Array.isArray(data.selectedYouTubeVideoIds) && data.selectedYouTubeVideoIds.length > 0) {
      try {
        console.log('[videos-page lifecycle] Creating YouTube components from', data.selectedYouTubeVideoIds.length, 'IDs');
        const newComponents = await createYouTubeComponentsFromIds(data.selectedYouTubeVideoIds);
        console.log('[videos-page lifecycle] Fetched', newComponents.length, 'components from API');

        const componentEntries = newComponents.map((comp: any) => {
          const entry: any = {};
          if (comp.videoId !== undefined) entry.videoId = String(comp.videoId || '');
          if (comp.youtubeUrl !== undefined) entry.youtubeUrl = String(comp.youtubeUrl || '');
          if (comp.manualTitle !== undefined) entry.manualTitle = String(comp.manualTitle || '');
          if (comp.manualDescription !== undefined) entry.manualDescription = String(comp.manualDescription || '');
          if (comp.manualChannelTitle !== undefined) entry.manualChannelTitle = String(comp.manualChannelTitle || '');
          if (comp.manualPublishedAt !== undefined && comp.manualPublishedAt !== null) {
            entry.manualPublishedAt = String(comp.manualPublishedAt);
          }
          if (comp.manualThumbnailUrl !== undefined && comp.manualThumbnailUrl !== null) {
            entry.manualThumbnailUrl = String(comp.manualThumbnailUrl);
          }
          if (comp.manualDuration !== undefined && comp.manualDuration !== null) {
            entry.manualDuration = String(comp.manualDuration);
          }
          if (comp.manualViewCount !== undefined && comp.manualViewCount !== null) {
            entry.manualViewCount = typeof comp.manualViewCount === 'number' ? comp.manualViewCount : Number(comp.manualViewCount);
          }
          if (comp.manualLikeCount !== undefined && comp.manualLikeCount !== null) {
            entry.manualLikeCount = typeof comp.manualLikeCount === 'number' ? comp.manualLikeCount : Number(comp.manualLikeCount);
          }
          if (comp.manualTags !== undefined && comp.manualTags !== null) {
            entry.manualTags = comp.manualTags;
          }
          if (comp.category !== undefined) entry.category = String(comp.category || 'Music Videos');

          return entry;
        });

        const serializedEntries = JSON.parse(JSON.stringify(componentEntries));

        const verifiedEntries = serializedEntries.map((entry: any) => {
          const verified: any = {};
          Object.keys(entry).forEach((key) => {
            const value = entry[key];
            if (value === null || value === undefined) {
              verified[key] = null;
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              verified[key] = value;
            } else if (key === 'manualTags' && Array.isArray(value)) {
              verified[key] = value;
            } else {
              console.error('[videos-page lifecycle] After serialization, found non-primitive:', key, typeof value, value);
            }
          });
          return verified;
        });

        console.log('[videos-page lifecycle] Verified entries count:', verifiedEntries.length);
        data.youtubeVideos = verifiedEntries;
      } catch (error) {
        console.error('[videos-page lifecycle] Error creating YouTube components:', error);
      }
    } else if (Array.isArray(data.youtubeVideos)) {
      try {
        data.youtubeVideos = await populateYouTubeComponents(data.youtubeVideos);
      } catch (error) {
        console.error('[videos-page lifecycle] Error populating YouTube components:', error);
      }
    }
  } catch (error) {
    console.error('[videos-page lifecycle] Error in populateVideosPage:', error);
  }
}

export default {
  // Lifecycle disabled - components are created manually in controller
};
