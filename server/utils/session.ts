import type { H3Event } from 'h3'

export const getUser = (event: H3Event) => {
  // @clerk/nuxt populates event.context.auth
  const auth = event.context.auth

  if (!auth?.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return {
    userId: auth.userId
  }
}
