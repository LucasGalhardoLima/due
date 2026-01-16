export default defineNuxtRouteMiddleware((to) => {
  const { userId } = useAuth()

  if (!userId.value && to.path !== '/' && to.path !== '/sign-in' && to.path !== '/sign-up') {
    return navigateTo('/sign-in')
  }

  if (userId.value && to.path === '/') {
    return navigateTo('/dashboard')
  }
})
