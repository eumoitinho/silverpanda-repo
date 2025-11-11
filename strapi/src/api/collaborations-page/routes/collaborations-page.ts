export default {
  routes: [
    {
      method: 'GET',
      path: '/collaborations-page',
      handler: 'collaborations-page.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/collaborations-page',
      handler: 'collaborations-page.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/collaborations-page/available-posts',
      handler: 'collaborations-page.getAvailablePosts',
      config: {
        auth: false,
      },
    },
  ],
};

