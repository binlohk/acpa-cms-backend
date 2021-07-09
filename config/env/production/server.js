module.exports = ({ env }) => ({
  host: env('HOST', 'http://app.acpa.training'),
  port: env.int('PORT', 1337),
  url: `http://app.acpa.training/api`,
  admin: {
    url: `http://app.acpa.training/admin`,
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'ce03286d6f96852ce508abc8a0e11d48'),
    },
  },
});