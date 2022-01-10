module.exports = ({ env }) => ({
  email: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: env("SENDGRID_API_KEY"),
      },
      settings: {
        defaultFrom: "admin@acpa.training",
        defaultReplyTo: "admin@acpa.training",
        testAddress: "admin@acpa.training",
      },
  },
});
