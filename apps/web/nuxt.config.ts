export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3100/api',
    },
  },
});
