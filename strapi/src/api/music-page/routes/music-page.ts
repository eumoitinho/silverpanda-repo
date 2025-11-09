export default {
  routes: [
    {
      method: 'GET',
      path: '/music-page',
      handler: 'music-page.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/music-page',
      handler: 'music-page.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/music-page/available-tracks',
      handler: 'music-page.getAvailableTracks',
      config: {
        auth: false,
      },
    },
  ],
};

