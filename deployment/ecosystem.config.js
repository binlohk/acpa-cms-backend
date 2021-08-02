module.exports = {
  apps: [
    {
      name: 'acpa',
      cwd: '/home/ubuntu/deploy-production/acpa-cms-backend',
      args: 'start',
      script: 'npm',
      env: {
        "NODE_ENV": "production",
        "DATABASE_FILENAME": "/home/ubuntu/deploy-production/data/acpa-backend.db",
        "STRAPI_URL": "https://app.acpa.training/api",
        "STRAPI_ADMIN_URL": "https://app.acpa.training/admin",
      },
    }
  ]
};

