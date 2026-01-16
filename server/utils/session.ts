import { clerkClient, H3EventContextWithClerk } from 'h3-clerk'
import type { H3Event } from 'h3'

export const getUser = (event: H3Event) => {
  const { auth } = event.context as H3EventContextWithClerk

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
