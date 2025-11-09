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
  },
  bootstrap(app: any) {},
};

