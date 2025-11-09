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
  ],
};

