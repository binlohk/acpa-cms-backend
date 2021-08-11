module.exports = ({ env }) => ({
  // ...
  email: {
    provider: 'sendgrid',
    providerOptions: {
      // apiKey: env('SENDGRID_API_KEY'),
      apiKey: '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',
    },
    settings: {
      defaultFrom: 'kelvin@acpa.training',
      defaultReplyTo: 'kelvin@acpa.training',
      testAddress: '',
    },

  },
  // ...
});