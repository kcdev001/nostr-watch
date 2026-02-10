export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  ssr: false,
  devtools: { enabled: true },
  colorMode: {
    preference: 'dark',
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3100/api',
    },
  },
  app: {
    head: {
      title: 'Nostr Watch',
      meta: [
        { name: 'description', content: 'Nostr data crawler and analysis platform' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
});
