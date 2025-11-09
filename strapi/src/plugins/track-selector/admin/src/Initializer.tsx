import { PLUGIN_ID } from './pluginId';

export const Initializer = ({ setPlugin }: { setPlugin: (pluginId: string) => void }) => {
  setPlugin(PLUGIN_ID);
  return null;
};

