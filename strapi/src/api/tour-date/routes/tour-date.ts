export default {
  routes: [
    {
      method: 'GET',
      path: '/tour-dates',
      handler: 'tour-date.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/tour-dates/:id',
      handler: 'tour-date.findOne',
      config: {
        auth: false,
      },
    },
  ],
};

