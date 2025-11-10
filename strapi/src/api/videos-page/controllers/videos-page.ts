import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::videos-page.videos-page', ({ strapi }) => ({
  async find(ctx) {
    try {
      const documents = await strapi.documents('api::videos-page.videos-page').findMany({
        status: 'published',
        limit: 1,
      });

      if (documents && documents.length > 0) {
        return { data: documents[0], meta: {} };
      }

      const draftDocuments = await strapi.documents('api::videos-page.videos-page').findMany({
        status: 'draft',
        limit: 1,
      });

      if (draftDocuments && draftDocuments.length > 0) {
        return { data: draftDocuments[0], meta: {} };
      }

      return { data: null, meta: {} };
    } catch (error) {
      strapi.log.error('Error in videos-page.find:', error);
      return { data: null, meta: {} };
    }
  },

  async update(ctx) {
    try {
      const { data } = ctx.request.body;

      if (!data) {
        return ctx.badRequest('Missing data in request body');
      }

      const cleanData: any = {
        selectedYouTubeVideoIds: Array.isArray(data.selectedYouTubeVideoIds)
          ? data.selectedYouTubeVideoIds.filter((id: any) => id && typeof id === 'string').map(String)
          : [],
      };

      const schemaFields = ['title', 'description'];
      schemaFields.forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          const value = data[key];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            cleanData[key] = value;
          }
        }
      });

      strapi.log.info('[videos-page] Update request received:', {
        selectedYouTubeVideoIds: cleanData.selectedYouTubeVideoIds?.length || 0,
        cleanDataKeys: Object.keys(cleanData),
      });

      const documents = await strapi.documents('api::videos-page.videos-page').findMany({
        status: 'draft',
        limit: 1,
      });

      if (!documents || documents.length === 0) {
        strapi.log.info('[videos-page] Creating new document');

        const { populateVideosPage } = await import('../content-types/videos-page/lifecycles');
        const dataWithComponents: any = { ...cleanData };
        await populateVideosPage(dataWithComponents, true);

        const createData: any = {
          selectedYouTubeVideoIds: cleanData.selectedYouTubeVideoIds || [],
        };

        if (cleanData.title) createData.title = cleanData.title;
        if (cleanData.description) createData.description = cleanData.description;

        if (dataWithComponents.youtubeVideos && Array.isArray(dataWithComponents.youtubeVideos)) {
          createData.youtubeVideos = dataWithComponents.youtubeVideos;
        }

        strapi.log.info('[videos-page] Creating document with components:', {
          hasYouTube: Array.isArray(createData.youtubeVideos),
          youtubeCount: createData.youtubeVideos?.length || 0,
        });

        const created = await strapi.documents('api::videos-page.videos-page').create({
          data: createData,
        });

        if (!created || !created.documentId) {
          strapi.log.error('[videos-page] Failed to create document');
          return ctx.internalServerError('Failed to create document');
        }

        strapi.log.info('[videos-page] Document created successfully');
        return { data: created, meta: {} };
      }

      const existing = documents[0];
      strapi.log.info('[videos-page] Updating existing document:', existing.documentId);

      const { populateVideosPage } = await import('../content-types/videos-page/lifecycles');
      const dataWithComponents = { ...cleanData };
      await populateVideosPage(dataWithComponents, true);

      const updated = await strapi.documents('api::videos-page.videos-page').update({
        documentId: existing.documentId,
        data: dataWithComponents,
      });

      strapi.log.info('[videos-page] Update successful');
      return { data: updated, meta: {} };
    } catch (error) {
      strapi.log.error('[videos-page] Error in update:', error);
      return ctx.internalServerError(error?.message || 'Failed to update videos page');
    }
  },

  async getAvailableVideos(ctx) {
    const channelId = ctx.query?.channelId;

    try {
      if (!channelId) {
        return ctx.badRequest('Missing channelId parameter');
      }

      // Ensure channelId is a string
      const channelIdString = typeof channelId === 'string' ? channelId : Array.isArray(channelId) ? channelId[0] : String(channelId);

      const { searchChannelVideos } = await import('../../../utils/integrations/youtube');
      const videos = await searchChannelVideos(channelIdString);
      return { data: videos, provider: 'youtube' };
    } catch (error) {
      strapi.log.error('Error fetching available videos:', error);
      return ctx.internalServerError('Failed to fetch videos');
    }
  },
}));
