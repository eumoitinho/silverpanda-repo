import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::collaborations-page.collaborations-page', ({ strapi }) => ({
  async find(ctx) {
    const { documentId, status } = ctx.query as { documentId?: string; status?: string };

    if (documentId) {
      const targetStatus = status === 'published' ? 'published' : 'draft';
      const document = await strapi.documents('api::collaborations-page.collaborations-page').findOne({
        documentId,
        status: targetStatus,
      });

      return { data: document ?? null, meta: {} };
    }

    return await super.find(ctx);
  },
}));

