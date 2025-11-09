import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::music-page.music-page', ({ strapi }) => ({
  async find(ctx) {
    try {
      // For single types, try to find the document
      const documents = await strapi.documents('api::music-page.music-page').findMany({
        status: 'published',
        limit: 1,
      });

      if (documents && documents.length > 0) {
        return { data: documents[0], meta: {} };
      }

      // If no published document, try draft
      const draftDocuments = await strapi.documents('api::music-page.music-page').findMany({
        status: 'draft',
        limit: 1,
      });

      if (draftDocuments && draftDocuments.length > 0) {
        return { data: draftDocuments[0], meta: {} };
      }

      // Return empty data if no document exists
      return { data: null, meta: {} };
    } catch (error) {
      strapi.log.error('Error in music-page.find:', error);
      return { data: null, meta: {} };
    }
  },

  async update(ctx) {
    try {
      const { data } = ctx.request.body;
      
      if (!data) {
        return ctx.badRequest('Missing data in request body');
      }

      // Clean and validate IDs - lifecycle will create components
      // ONLY include selectedTrackIds and other primitive fields from schema
      const cleanData: any = {
        selectedSpotifyTrackIds: Array.isArray(data.selectedSpotifyTrackIds) 
          ? data.selectedSpotifyTrackIds.filter((id: any) => id && (typeof id === 'string' || typeof id === 'number')).map(String)
          : [],
        selectedSoundcloudTrackIds: Array.isArray(data.selectedSoundcloudTrackIds)
          ? data.selectedSoundcloudTrackIds.filter((id: any) => id && (typeof id === 'string' || typeof id === 'number')).map(String)
          : [],
      };

      // Include ONLY schema fields (title, description) - NO system fields, NO components
      const schemaFields = ['title', 'description'];
      schemaFields.forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          const value = data[key];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            cleanData[key] = value;
          }
        }
      });

      strapi.log.info('[music-page] Update request received:', {
        selectedSpotifyTrackIds: cleanData.selectedSpotifyTrackIds?.length || 0,
        selectedSoundcloudTrackIds: cleanData.selectedSoundcloudTrackIds?.length || 0,
        hasSpotifyTracks: Array.isArray(cleanData.spotifyTracks),
        hasSoundcloudTracks: Array.isArray(cleanData.soundcloudTracks),
        cleanDataKeys: Object.keys(cleanData),
      });
      
      // Log first component structure if exists
      if (Array.isArray(cleanData.spotifyTracks) && cleanData.spotifyTracks.length > 0) {
        strapi.log.info('[music-page] First Spotify component sample:', JSON.stringify(cleanData.spotifyTracks[0], null, 2));
      }
      if (Array.isArray(cleanData.soundcloudTracks) && cleanData.soundcloudTracks.length > 0) {
        strapi.log.info('[music-page] First SoundCloud component sample:', JSON.stringify(cleanData.soundcloudTracks[0], null, 2));
      }
      
      // For single types, use findMany to get the document
      const documents = await strapi.documents('api::music-page.music-page').findMany({
        status: 'draft',
        limit: 1,
      });

      if (!documents || documents.length === 0) {
        // Create if doesn't exist
        strapi.log.info('[music-page] Creating new document');
        
        // Create document with components directly - lifecycle is disabled
        const { populateMusicPage } = await import('../content-types/music-page/lifecycles');
        const dataWithComponents: any = { ...cleanData };
        await populateMusicPage(dataWithComponents, true);
        
        // Components should be passed as plain objects - Strapi will create them automatically
        // Ensure components are properly formatted
        const createData: any = {
          selectedSpotifyTrackIds: cleanData.selectedSpotifyTrackIds || [],
          selectedSoundcloudTrackIds: cleanData.selectedSoundcloudTrackIds || [],
        };
        
        if (cleanData.title) createData.title = cleanData.title;
        if (cleanData.description) createData.description = cleanData.description;
        
        // Add components as arrays of plain objects
        if (dataWithComponents.spotifyTracks && Array.isArray(dataWithComponents.spotifyTracks)) {
          createData.spotifyTracks = dataWithComponents.spotifyTracks;
        }
        if (dataWithComponents.soundcloudTracks && Array.isArray(dataWithComponents.soundcloudTracks)) {
          createData.soundcloudTracks = dataWithComponents.soundcloudTracks;
        }
        
        strapi.log.info('[music-page] Creating document with components:', {
          hasSpotify: Array.isArray(createData.spotifyTracks),
          spotifyCount: createData.spotifyTracks?.length || 0,
          hasSoundcloud: Array.isArray(createData.soundcloudTracks),
          soundcloudCount: createData.soundcloudTracks?.length || 0,
        });
        
        const created = await strapi.documents('api::music-page.music-page').create({
          data: createData,
        });
        
        if (!created || !created.documentId) {
          strapi.log.error('[music-page] Failed to create document');
          return ctx.internalServerError('Failed to create document');
        }
        
        strapi.log.info('[music-page] Document created successfully');
        return { data: created, meta: {} };
      }

      const existing = documents[0];
      strapi.log.info('[music-page] Updating existing document:', existing.documentId);
      
      // Create components before updating - lifecycle is disabled
      const { populateMusicPage } = await import('../content-types/music-page/lifecycles');
      const dataWithComponents = { ...cleanData };
      await populateMusicPage(dataWithComponents, true);
      
      // Update existing
      const updated = await strapi.documents('api::music-page.music-page').update({
        documentId: existing.documentId,
        data: dataWithComponents,
      });

      strapi.log.info('[music-page] Update successful');
      return { data: updated, meta: {} };
    } catch (error) {
      strapi.log.error('[music-page] Error in update:', error);
      return ctx.internalServerError(error?.message || 'Failed to update music page');
    }
  },

  async getAvailableTracks(ctx) {
    const provider = ctx.query?.provider || 'spotify';
    
    try {
      if (provider === 'spotify') {
        const { getTopTracks } = await import('../../../utils/integrations/spotify');
        const tracks = await getTopTracks();
        return { data: tracks, provider: 'spotify' };
      } else if (provider === 'soundcloud') {
        const { getTopTracks } = await import('../../../utils/integrations/soundcloud');
        const tracks = await getTopTracks();
        return { data: tracks, provider: 'soundcloud' };
      }
      
      return ctx.badRequest('Invalid provider. Use "spotify" or "soundcloud"');
    } catch (error) {
      strapi.log.error('Error fetching available tracks:', error);
      return ctx.internalServerError('Failed to fetch tracks');
    }
  },
}));

