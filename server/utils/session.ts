import { getCookie, createError, getHeader } from 'h3'
import type { H3Event } from 'h3'

export const getUser = (event: H3Event) => {
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
  const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST || !!process.env.CI

  // 1. Check for Test Environment (Bypass auth for integration tests)
  if (isTest) {
    return { userId: 'user_test' }
  }

  // 2. Check for Demo Mode (Development only)
  const demoCookie = getCookie(event, 'demo_mode')

  if (isDev && demoCookie === 'true') {
    return {
      userId: 'user_demo_test_account'
    }
  }

  // 3. Agent API Key (headless access for virtual team agents)
  const agentKey = getHeader(event, 'x-agent-api-key')
  if (agentKey && process.env.AGENT_API_KEY && agentKey === process.env.AGENT_API_KEY) {
    return {
      userId: 'user_demo_test_account'
    }
  }

  // 4. Regular Clerk Authentication
  const authFn = (event.context as { auth?: () => { userId?: string } }).auth
  const auth = typeof authFn === 'function' ? authFn() : null

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
