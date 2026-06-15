import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// Per-minute rate limiting via in-memory store (production would use Redis)
// ─────────────────────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Tier-based rate limits (requests per minute)
const TIER_RATES: Record<string, number> = {
  free_trial: 10,
  starter: 30,
  pro: 100,
  managed: 300,
  superadmin: 1000,
}

function getRateLimit(tier: string | undefined): number {
  if (!tier) return TIER_RATES.free_trial // default: same as free_trial
  return TIER_RATES[tier] || TIER_RATES.free_trial
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-IP daily audit limit
// ─────────────────────────────────────────────────────────────────────────────

const DAILY_AUDIT_LIMIT = 3 // Free/unauthenticated: 3 audits per IP per day

interface DailyAuditEntry {
  count: number
  resetAt: number // midnight timestamp (start of next day)
}

const dailyAuditMap = new Map<string, DailyAuditEntry>()

/**
 * Get the timestamp for the start of the next day (midnight) in UTC.
 */
function getNextMidnight(): number {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  return tomorrow.getTime()
}

/**
 * Get client IP from request headers.
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  // Only rate-limit API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip webhooks (they have their own auth via signatures)
  if (request.nextUrl.pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next()
  }

  // Skip auth routes (login/register should not be rate-limited aggressively)
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Skip health checks
  if (request.nextUrl.pathname === '/api/route') {
    return NextResponse.next()
  }

  // ── Client identification ──────────────────────────────────────────────────
  const ip = getClientIP(request)
  const sessionToken = request.cookies.get('seosights_session')?.value

  // When session cookie is available, use it; otherwise fall back to IP
  const clientId = sessionToken || ip

  // ── Determine tier from session cookie ─────────────────────────────────────
  // Tier is stored in a separate cookie set by the auth system.
  // Format: plain string like "pro", "starter", etc.
  const tierCookie = request.cookies.get('seosights_tier')?.value
  const limit = getRateLimit(tierCookie)

  // ── Per-minute rate limiting ───────────────────────────────────────────────
  const now = Date.now()
  const windowMs = 60_000 // 1 minute window

  const entry = rateLimitMap.get(clientId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + windowMs })

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(limit - 1))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)))
    return applyDailyAuditCheck(request, ip, sessionToken, response)
  }

  if (entry.count >= limit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please slow down.', code: 'RATE_LIMITED' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
        },
      },
    )
  }

  entry.count++

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', String(limit))
  response.headers.set('X-RateLimit-Remaining', String(limit - entry.count))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)))

  return applyDailyAuditCheck(request, ip, sessionToken, response)
}

/**
 * Apply per-IP daily audit limit for the /api/analyze endpoint.
 * Free/unauthenticated users get 3 audits per IP per day.
 * Authenticated users with a paid tier bypass this limit.
 */
function applyDailyAuditCheck(
  request: NextRequest,
  ip: string,
  sessionToken: string | undefined,
  response: NextResponse,
): NextResponse {
  // Only apply daily audit limit to the analyze endpoint
  if (!request.nextUrl.pathname.startsWith('/api/analyze')) {
    return response
  }

  // If user is authenticated with a paid tier, skip daily audit limit
  const tierCookie = request.cookies.get('seosights_tier')?.value
  if (sessionToken && tierCookie && tierCookie !== 'free_trial') {
    return response
  }

  const now = Date.now()
  const dailyKey = `daily_audit:${ip}`
  const dailyEntry = dailyAuditMap.get(dailyKey)

  if (!dailyEntry || now > dailyEntry.resetAt) {
    // Reset at next midnight
    const resetAt = getNextMidnight()
    dailyAuditMap.set(dailyKey, { count: 1, resetAt })
    response.headers.set('X-DailyAudit-Limit', String(DAILY_AUDIT_LIMIT))
    response.headers.set('X-DailyAudit-Remaining', String(DAILY_AUDIT_LIMIT - 1))
    return response
  }

  if (dailyEntry.count >= DAILY_AUDIT_LIMIT) {
    const secondsUntilMidnight = Math.ceil((dailyEntry.resetAt - now) / 1000)
    return NextResponse.json(
      {
        error: 'Daily audit limit exceeded. Upgrade your plan for more audits.',
        code: 'DAILY_LIMIT_EXCEEDED',
        retryAfterSeconds: secondsUntilMidnight,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(secondsUntilMidnight),
          'X-DailyAudit-Limit': String(DAILY_AUDIT_LIMIT),
          'X-DailyAudit-Remaining': '0',
          'X-DailyAudit-Reset': String(Math.ceil(dailyEntry.resetAt / 1000)),
        },
      },
    )
  }

  dailyEntry.count++
  response.headers.set('X-DailyAudit-Limit', String(DAILY_AUDIT_LIMIT))
  response.headers.set('X-DailyAudit-Remaining', String(DAILY_AUDIT_LIMIT - dailyEntry.count))

  return response
}

export const config = {
  matcher: '/api/:path*',
}
