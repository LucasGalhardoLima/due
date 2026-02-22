import { ptBR } from '@clerk/localizations'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/eslint',
    '@clerk/nuxt',
    '@nuxtjs/color-mode',
    '@vite-pwa/nuxt',
    // '@nuxtjs/supabase', // Not needed for MVP with local SQLite
  ],
  css: ['~/assets/css/tailwind.css'],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Du - Seu Assistente Financeiro',
      short_name: 'Du',
      description: 'Oi, eu sou o Du! Vou te ajudar a sair do buraco da fatura e conquistar sua liberdade financeira.',
      theme_color: '#121212',
      background_color: '#121212',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icons/icon-72x72.svg', sizes: '72x72', type: 'image/svg+xml' },
        { src: '/icons/icon-512x512.svg', sizes: '96x96 128x128 144x144 152x152 192x192 384x384 512x512', type: 'image/svg+xml' },
        { src: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' }
      ]
    },
    workbox: {
      navigateFallback: '/offline',
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\.clerk\..*$/,
          handler: 'NetworkFirst',
          options: { cacheName: 'clerk-api-cache' }
        },
        {
          urlPattern: /\/api\/.*/,
          handler: 'NetworkFirst',
          options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } }
        },
        {
          urlPattern: /\.(js|css|woff2?|png|jpg|jpeg|svg|gif|ico)$/,
          handler: 'CacheFirst',
          options: { cacheName: 'static-assets', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } }
        }
      ]
    },
    devOptions: {
      enabled: false,
      type: 'module'
    }
  },
  colorMode: {
    classSuffix: '',
    preference: 'dark', // Default to Dark Mode
    fallback: 'dark',
  },
  // supabase: {
  //   redirect: false, // We'll handle auth redirect manually if needed
  // },
  clerk: {
    localization: ptBR,
    appearance: {
      variables: {
        colorPrimary: '#171717',
        colorBackground: 'transparent',
        colorNeutral: '#1a1a1a',
        colorForeground: '#1a1a1a',
        colorMutedForeground: '#737373',
        colorInput: '#e3e3e3',
        colorInputForeground: '#1a1a1a',
        colorBorder: '#e3e3e3',
        colorDanger: '#171717',
        colorSuccess: '#171717',
        fontFamily: '"Geist", ui-sans-serif, system-ui, sans-serif',
        fontFamilyButtons: '"Geist Pixel Square", ui-monospace, monospace',
        borderRadius: '0.75rem',
        fontSize: '0.875rem',
      },
      elements: {
        rootBox: 'w-full',
        cardBox: 'shadow-none bg-transparent',
        card: 'shadow-none bg-transparent',
      },
    },
  },
  runtimeConfig: {
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripePlusMonthlyPriceId: '',
    stripePlusAnnualPriceId: '',
    stripeProMonthlyPriceId: '',
    stripeProAnnualPriceId: '',
  },
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
      title: 'Due - Finanças Reimaginadas',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'theme-color', content: '#121212' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Due' },
        { name: 'description', content: 'Controle inteligente de cartão de crédito com projeção futura, Advisor IA e importação automática.' }
      ],
      link: [
        { rel: 'preload', href: '/fonts/GeistPixel-Square.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        { rel: 'preload', href: '/fonts/Geist-Variable.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.svg' }
      ]
    }
  }
})
