module.exports = {
  apps: [
    {
      name: 'acpa',
      cwd: '/home/ubuntu/deploy-production/acpa-cms-backend',
      script: 'npm',
      args: 'start',
      env: {
        "NODE_ENV": "production",
        "DATABASE_FILENAME": "/home/ubuntu/deploy-production/data/acpa-backend.db",
        "STRAPI_URL": "http://app.acpa.training/api",
        "STRAPI_ADMIN_URL": "http://app.acpa.training/api/admin",
      },
    }
  ]
};

