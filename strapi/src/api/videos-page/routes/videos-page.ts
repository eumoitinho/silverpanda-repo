export default {
  routes: [
    {
      method: 'GET',
      path: '/videos-page',
      handler: 'videos-page.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/videos-page',
      handler: 'videos-page.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/videos-page/available-videos',
      handler: 'videos-page.getAvailableVideos',
      config: {
        auth: false,
      },
    },
  ],
};
