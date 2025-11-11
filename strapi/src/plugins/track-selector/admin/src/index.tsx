import { Initializer } from './Initializer';
import { PLUGIN_ID } from './pluginId';

export default {
  register(app: any) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: 'Track Selector',
    });
    
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}`,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: 'Track Selector',
      },
      Component: () => import('./pages/HomePage').then((mod) => mod.default),
      permissions: [],
    });
  },
  bootstrap(app: any) {},
};

