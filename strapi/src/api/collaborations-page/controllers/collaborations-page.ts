import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::collaborations-page.collaborations-page', ({ strapi }) => ({
  async find(ctx) {
    try {
      const { documentId, status } = ctx.query as { documentId?: string; status?: string };

      if (documentId) {
        const targetStatus = status === 'published' ? 'published' : 'draft';
        const document = await strapi.documents('api::collaborations-page.collaborations-page').findOne({
          documentId,
          status: targetStatus,
        });

        return { data: document ?? null, meta: {} };
      }

      const documents = await strapi.documents('api::collaborations-page.collaborations-page').findMany({
        status: 'published',
        limit: 1,
      });

      if (documents && documents.length > 0) {
        return { data: documents[0], meta: {} };
      }

      const draftDocuments = await strapi.documents('api::collaborations-page.collaborations-page').findMany({
        status: 'draft',
        limit: 1,
      });

      if (draftDocuments && draftDocuments.length > 0) {
        return { data: draftDocuments[0], meta: {} };
      }

      return { data: null, meta: {} };
    } catch (error) {
      strapi.log.error('Error in collaborations-page.find:', error);
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
        selectedInstagramPostIds: Array.isArray(data.selectedInstagramPostIds)
          ? data.selectedInstagramPostIds.filter((id: any) => id && typeof id === 'string').map(String)
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

      strapi.log.info('[collaborations-page] Update request received:', {
        selectedInstagramPostIds: cleanData.selectedInstagramPostIds?.length || 0,
        cleanDataKeys: Object.keys(cleanData),
      });

      const documents = await strapi.documents('api::collaborations-page.collaborations-page').findMany({
        status: 'draft',
        limit: 1,
      });

      if (!documents || documents.length === 0) {
        strapi.log.info('[collaborations-page] Creating new document');

        const { populateCollaborationsPage } = await import('../content-types/collaborations-page/lifecycles');
        const dataWithComponents: any = { ...cleanData };
        await populateCollaborationsPage(dataWithComponents, true);

        const createData: any = {
          selectedInstagramPostIds: cleanData.selectedInstagramPostIds || [],
        };

        if (cleanData.title) createData.title = cleanData.title;
        if (cleanData.description) createData.description = cleanData.description;

        if (dataWithComponents.instagramPosts && Array.isArray(dataWithComponents.instagramPosts)) {
          createData.instagramPosts = dataWithComponents.instagramPosts;
        }

        strapi.log.info('[collaborations-page] Creating document with components:', {
          hasInstagram: Array.isArray(createData.instagramPosts),
          instagramCount: createData.instagramPosts?.length || 0,
        });

        const created = await strapi.documents('api::collaborations-page.collaborations-page').create({
          data: createData,
        });

        if (!created || !created.documentId) {
          strapi.log.error('[collaborations-page] Failed to create document');
          return ctx.internalServerError('Failed to create document');
        }

        strapi.log.info('[collaborations-page] Document created successfully');
        return { data: created, meta: {} };
      }

      const existing = documents[0];
      strapi.log.info('[collaborations-page] Updating existing document:', existing.documentId);

      const { populateCollaborationsPage } = await import('../content-types/collaborations-page/lifecycles');
      const dataWithComponents = { ...cleanData };
      await populateCollaborationsPage(dataWithComponents, true);

      const updated = await strapi.documents('api::collaborations-page.collaborations-page').update({
        documentId: existing.documentId,
        data: dataWithComponents,
      });

      strapi.log.info('[collaborations-page] Update successful');
      return { data: updated, meta: {} };
    } catch (error) {
      strapi.log.error('[collaborations-page] Error in update:', error);
      return ctx.internalServerError(error?.message || 'Failed to update collaborations page');
    }
  },

  async getAvailablePosts(ctx) {
    try {
      const { getRecentMedia } = await import('../../../utils/integrations/instagram');
      const posts = await getRecentMedia();
      return { data: posts, provider: 'instagram' };
    } catch (error) {
      strapi.log.error('Error fetching available posts:', error);
      return ctx.internalServerError('Failed to fetch Instagram posts');
    }
  },
}));

