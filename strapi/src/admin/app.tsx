import type { StrapiApp } from '@strapi/strapi/admin';
import React from 'react';

export default {
  config: {
    locales: [],
  },
  bootstrap(app: StrapiApp) {
    app.addMenuLink({
      to: '/plugins/track-selector',
      icon: 'disc',
      intlLabel: {
        id: 'track-selector.plugin.name',
        defaultMessage: 'Track Selector',
      },
      Component: async () => {
        try {
          const module = await import('../plugins/track-selector/admin/src');
          return module.default;
        } catch (error) {
          console.error('Error loading Track Selector component:', error);
          // Return a simple error component
          const ErrorComponent: React.FC = () => React.createElement('div', null, 'Error loading Track Selector. Check console for details.');
          return ErrorComponent;
        }
      },
      permissions: [],
    });
  },
};

