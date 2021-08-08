module.exports = {
  apps: [
    {
      name: 'acpa',
      cwd: '/home/ubuntu/deploy-production/acpa-cms-backend',
      script: 'npm',
      args: 'start',
      env: {
        "NODE_ENV": "production_",
        "DATABASE_FILENAME": "/home/ubuntu/deploy-production/data/acpa-backend.db",
        "STRAPI_URL": "https://app.acpa.training/api",
        "STRAPI_ADMIN_URL": "https://app.acpa.training/api/admin",
        "HOST": "0.0.0.0",
        "EXPO_ACCESS_TOKEN": "IFRh6S6xy8DCpE4PM1mvTFuVInnfgiFEwtmUHm3y",
      },
    }
  ]
};

