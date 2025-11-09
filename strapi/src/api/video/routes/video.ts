export default {
  routes: [
    {
      method: 'GET',
      path: '/videos',
      handler: 'video.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/videos/:id',
      handler: 'video.findOne',
      config: {
        auth: false,
      },
    },
  ],
};

