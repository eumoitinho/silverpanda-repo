import { fetchInstagramPost, extractPostIdFromUrl } from '../../../../utils/integrations/instagram';

type ComponentEntry = Record<string, any>;

function cloneComponent(entry: ComponentEntry): ComponentEntry {
  if (!entry || typeof entry !== 'object') return entry;
  return { ...entry };
}

async function createInstagramComponentsFromIds(postIds: string[]): Promise<ComponentEntry[]> {
  if (!Array.isArray(postIds) || postIds.length === 0) return [];

  const components = await Promise.all(
    postIds
      .filter((id) => id && typeof id === 'string' && id.trim().length > 0)
      .map(async (postIdOrUrl) => {
        const cleanInput = String(postIdOrUrl).trim();

        // Extrair ID da URL se necessário (ou usar permalink diretamente)
        const postId = await extractPostIdFromUrl(cleanInput);

        // Para Instagram, vamos usar o permalink como identificador principal
        const permalink = cleanInput.startsWith('http') ? cleanInput : `https://www.instagram.com/p/${cleanInput}/`;

        const component: any = {
          permalink,
          caption: null,
          timestamp: null,
          likes: null,
          comments: null,
          mediaUrl: null,
          mediaType: 'image',
        };

        // Se temos um ID válido, tentar buscar dados da API
        if (postId) {
          const data = await fetchInstagramPost(postId);

          if (data) {
            component.permalink = String(data.permalink || permalink);
            component.caption = data.caption ? String(data.caption) : null;
            component.mediaUrl = data.mediaUrl ? String(data.mediaUrl) : null;
            component.mediaType = data.mediaType ? String(data.mediaType.toLowerCase()) : 'image';

            if (data.timestamp) {
              const dateStr = String(data.timestamp);
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}/) || !isNaN(Date.parse(dateStr))) {
                component.timestamp = dateStr;
              }
            }

            if (typeof data.likeCount === 'number') {
              component.likes = data.likeCount;
            }

            if (typeof data.commentsCount === 'number') {
              component.comments = data.commentsCount;
            }
          }
        }

        return component;
      })
  );

  return components.filter(Boolean);
}

function shouldPopulateInstagram(entry: ComponentEntry): boolean {
  if (!entry) return false;
  const manual = [
    entry.caption,
    entry.mediaUrl,
  ];
  return manual.some((value) => !value);
}

async function populateInstagramComponents(entries: ComponentEntry[]): Promise<ComponentEntry[]> {
  if (!Array.isArray(entries)) return entries;

  return Promise.all(
    entries.map(async (rawEntry) => {
      const entry = cloneComponent(rawEntry);

      if (!shouldPopulateInstagram(entry)) {
        return entry;
      }

      const permalink = typeof entry.permalink === 'string' ? entry.permalink.trim() : '';

      if (!permalink) {
        return entry;
      }

      const postId = await extractPostIdFromUrl(permalink);

      if (!postId) {
        return entry;
      }

      const data = await fetchInstagramPost(postId);
      if (!data) {
        return entry;
      }

      if (!entry.permalink && data.permalink) entry.permalink = data.permalink;
      if (!entry.caption && data.caption) entry.caption = data.caption;
      if (!entry.mediaUrl && data.mediaUrl) entry.mediaUrl = data.mediaUrl;
      if (!entry.mediaType && data.mediaType) entry.mediaType = data.mediaType.toLowerCase();
      if (!entry.timestamp && data.timestamp) entry.timestamp = data.timestamp;
      if (!entry.likes && data.likeCount) entry.likes = data.likeCount;
      if (!entry.comments && data.commentsCount) entry.comments = data.commentsCount;

      return entry;
    }),
  );
}

export async function populateCollaborationsPage(data: Record<string, any>, skipLifecycle = false) {
  if (!data || typeof data !== 'object') return;

  // Remove system fields and existing components
  delete data.instagramPosts;
  delete data.publishedAt;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.id;
  delete data.documentId;
  delete data.createdBy;
  delete data.updatedBy;

  console.log('[collaborations-page lifecycle] populateCollaborationsPage called with:', {
    hasSelectedInstagram: Array.isArray(data.selectedInstagramPostIds) && data.selectedInstagramPostIds.length > 0,
    keys: Object.keys(data),
  });

  try {
    if (data.selectedInstagramPostIds && Array.isArray(data.selectedInstagramPostIds) && data.selectedInstagramPostIds.length > 0) {
      try {
        console.log('[collaborations-page lifecycle] Creating Instagram components from', data.selectedInstagramPostIds.length, 'IDs/URLs');
        const newComponents = await createInstagramComponentsFromIds(data.selectedInstagramPostIds);
        console.log('[collaborations-page lifecycle] Fetched', newComponents.length, 'components from API');

        const componentEntries = newComponents.map((comp: any) => {
          const entry: any = {};
          if (comp.permalink !== undefined) entry.permalink = String(comp.permalink || '');
          if (comp.caption !== undefined && comp.caption !== null) entry.caption = String(comp.caption);
          if (comp.timestamp !== undefined && comp.timestamp !== null) entry.timestamp = String(comp.timestamp);
          if (comp.likes !== undefined && comp.likes !== null) {
            entry.likes = typeof comp.likes === 'number' ? comp.likes : Number(comp.likes);
          }
          if (comp.comments !== undefined && comp.comments !== null) {
            entry.comments = typeof comp.comments === 'number' ? comp.comments : Number(comp.comments);
          }
          if (comp.mediaUrl !== undefined && comp.mediaUrl !== null) entry.mediaUrl = String(comp.mediaUrl);
          if (comp.mediaType !== undefined) entry.mediaType = String(comp.mediaType || 'image');

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
            } else {
              console.error('[collaborations-page lifecycle] After serialization, found non-primitive:', key, typeof value, value);
            }
          });
          return verified;
        });

        console.log('[collaborations-page lifecycle] Verified entries count:', verifiedEntries.length);
        data.instagramPosts = verifiedEntries;
      } catch (error) {
        console.error('[collaborations-page lifecycle] Error creating Instagram components:', error);
      }
    } else if (Array.isArray(data.instagramPosts)) {
      try {
        data.instagramPosts = await populateInstagramComponents(data.instagramPosts);
      } catch (error) {
        console.error('[collaborations-page lifecycle] Error populating Instagram components:', error);
      }
    }
  } catch (error) {
    console.error('[collaborations-page lifecycle] Error in populateCollaborationsPage:', error);
  }
}

export default {
  // Lifecycle disabled - components are created manually in controller
};
