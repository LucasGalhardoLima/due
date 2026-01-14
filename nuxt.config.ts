// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
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
    pageTransition: { name: 'page', mode: 'out-in' }
  }
})
