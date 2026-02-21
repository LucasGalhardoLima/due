// Session-level cache to avoid repeated API calls
let onboardingChecked = false

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
  // Skip if already on onboarding page or if onboarding is complete (cookie = fast path)
  if (userId.value && to.path === '/dashboard' && to.path !== '/onboarding') {
    // Fast path: cookie exists, skip server check
    if (onboardingCookie.value || onboardingChecked) {
      return
    }

    // No cookie — check server for persisted onboarding state
    try {
      const { completedAt } = await $fetch<{ completedAt: string | null }>('/api/user/onboarding')

      if (completedAt) {
        // Hydrate the cookie so future checks are fast
        const cookie = useCookie('onboarding_complete', { maxAge: 60 * 60 * 24 * 365, path: '/' })
        cookie.value = 'true'
        onboardingChecked = true
        return
      }
    } catch {
      // If the API call fails, fall through to redirect
    }

    return navigateTo('/onboarding')
  }
})
