export default defineNuxtConfig({
  compatibilityDate: '2026-05-26',
  devtools: { enabled: true },
  srcDir: 'app',
  css: ['~/assets/css/main.css', '~/assets/css/default-theme.css'],
  runtimeConfig: {
    mongodbUri: process.env.NUXT_MONGODB_URI || process.env.MONGODB_URI || '',
    mongodbAddr: process.env.NUXT_MONGODB_ADDR || process.env.MONGODB_ADDR || '',
    mongoUsername: process.env.NUXT_MONGO_USERNAME || process.env.MONGO_USERNAME || '',
    mongoPassword: process.env.NUXT_MONGO_PWD || process.env.MONGO_PWD || '',
    mongodbDbName: process.env.NUXT_MONGODB_DB_NAME || process.env.MONGODB_DB_NAME || process.env.NUXT_MONGO_DBNAME || process.env.MONGO_DBNAME || '',
    adminKey: process.env.NUXT_ADMIN_KEY || process.env.ADMIN_KEY || '',
    sessionSecret: process.env.NUXT_SESSION_SECRET || process.env.SESSION_SECRET || '',
    uploadDir: process.env.NUXT_UPLOAD_DIR || process.env.UPLOAD_DIR || 'uploads',
    defaultSiteId: process.env.NUXT_DEFAULT_SITE_ID || process.env.DEFAULT_SITE_ID || 'readfit',
    public: {
      appName: 'MultiSite CMS',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
