module.exports = ({ env }) => ({
  host: env('HOST', 'app.acpa.training'),
  port: env.int('PORT', 1337),
  url: 'http://app.acpa.training',
  admin: {
    auth: {
      url: 'http://app.acpa.training/dashboard',
      secret: env('ADMIN_JWT_SECRET', 'ce03286d6f96852ce508abc8a0e11d48'),
    },
  },
});

