export default {
  routes: [
    {
      method: 'GET',
      path: '/press-features',
      handler: 'press-feature.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/press-features/:id',
      handler: 'press-feature.findOne',
      config: {
        auth: false,
      },
    },
  ],
};

