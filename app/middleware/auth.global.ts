export default defineNuxtRouteMiddleware((to) => {
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
  const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST || !!process.env.CI
  const demoCookie = useCookie('demo_mode')

  // Bypass auth in demo mode (dev only) or during tests
  if ((isDev && demoCookie.value === 'true') || isTest) {
    return
  }

  const { userId } = useAuth()

  if (!userId.value && to.path !== '/' && to.path !== '/sign-in' && to.path !== '/sign-up') {
    return navigateTo('/sign-in')
  }

  if (userId.value && to.path === '/') {
    return navigateTo('/dashboard')
  }
})
