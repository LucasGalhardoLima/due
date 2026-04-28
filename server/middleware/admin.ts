import { getRequestIP } from 'h3'
import { enforceRateLimit } from '../utils/ai-rate-limit'

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/admin')) return

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'

  // Rate limiting: 20 requests per minute per IP
  enforceRateLimit(`admin:${ip}`, 20, 60_000)

  // IP allowlisting: if ADMIN_ALLOWED_IPS is set, only those IPs may reach admin routes
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS
  if (allowedIPs) {
    const allowed = allowedIPs.split(',').map((s) => s.trim())
    if (!allowed.includes(ip)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden — IP not allowed' })
    }
  }
})
