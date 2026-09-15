import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-09-15',
  devtools: { enabled: true },

  modules: ['@vueuse/nuxt', '@nuxt/icon'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  icon: {
    mode: 'css',
    cssLayer: 'base',
  },

  typescript: {
    strict: true,
  },

  future: { compatibilityVersion: 4 },
})
