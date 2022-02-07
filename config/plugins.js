module.exports = ({ env }) => ({
  email: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: env("SENDGRID_API_KEY"),
      },
      settings: {
        defaultFrom: "kelvin@acpa.training",
        defaultReplyTo: "kelvin@acpa.training",
        testAddress: "kelvin@acpa.training",
      },
  },
});
