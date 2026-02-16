export default defineNuxtRouteMiddleware(async (to) => {
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
  const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST || !!process.env.CI
  const demoCookie = useCookie('demo_mode')
  const onboardingCookie = useCookie('onboarding_complete')

  // Bypass auth in demo mode (dev only) or during tests
  if ((isDev && demoCookie.value === 'true') || isTest) {
    return
  }

  const { userId } = useAuth()

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/sign-in', '/sign-up', '/sso-callback', '/terms', '/privacy', '/offline']
  if (!userId.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/sign-in')
  }

  // Redirect logged-in users from landing page
  if (userId.value && to.path === '/') {
    return navigateTo('/dashboard')
  }

  // Onboarding flow: check if user needs to complete onboarding
  // Skip if already on onboarding page or if onboarding is complete
  if (userId.value && !onboardingCookie.value && to.path !== '/onboarding' && !publicRoutes.includes(to.path)) {
    // Only redirect to onboarding for dashboard-like routes
    // This allows users to access other pages like /cards if they skip onboarding
    if (to.path === '/dashboard') {
      // Check if user has any cards (server-side would be better, but this is a simple client check)
      // For now, we trust the cookie - if they completed onboarding or have data, they won't be redirected
      return navigateTo('/onboarding')
    }
  }
})
