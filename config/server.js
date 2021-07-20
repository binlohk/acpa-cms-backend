module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0', '174.138.20.136'),
  port: env.int('PORT', 1337),
  url: env('STRAPI_URL', ''),
  admin: {
    url: env('STRAPI_ADMIN_URL', '/admin'),
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'ce03286d6f96852ce508abc8a0e11d48'),
    },
  },
});

