// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/eslint',
    // '@nuxtjs/supabase', // Not needed for MVP with local SQLite
  ],
  // supabase: {
  //   redirect: false, // We'll handle auth redirect manually if needed
  // },
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  // Build Configuration
  build: {
    transpile: ['lucide-vue-next', 'vue-sonner']
  },
  
  // Component Discovery
  components: [
    {
      path: '~/components',
      extensions: ['.vue'], // Ignore index.ts files to avoid duplicate warnings
    }
  ],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' }
      ]
    }
  }
})
