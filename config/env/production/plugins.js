module.exports = ({ env }) => ({
  // ...
  email: {
    provider: 'sendgrid',
    providerOptions: {
      // apiKey: env('SENDGRID_API_KEY'),
      apiKey: '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',
    },
    settings: {
      defaultFrom: 'mark@binlo.io',
      defaultReplyTo: 'mark@binlo.io',
      testAddress: 'wongw859@gmail.com',
    },

  },
  // ...
});