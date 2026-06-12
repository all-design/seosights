import { NextRequest, NextResponse } from 'next/server'

// Rate limiting via in-memory store (production would use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Tier-based rate limits (requests per minute)
const TIER_RATES: Record<string, number> = {
  free_trial: 10,
  starter: 30,
  pro: 100,
  managed: 300,
  superadmin: 1000,
}

function getRateLimit(tier: string): number {
  return TIER_RATES[tier] || TIER_RATES.free_trial
}

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

  // Get client identifier (IP + user agent for anonymous, or user ID from cookie)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  const sessionToken = request.cookies.get('seosights_session')?.value
  const clientId = sessionToken || ip

  const now = Date.now()
  const windowMs = 60_000 // 1 minute window

  const entry = rateLimitMap.get(clientId)
  const limit = 60 // Default: 60 req/min for API routes (generous for development)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + windowMs })

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(limit - 1))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)))
    return response
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
  return response
}

export const config = {
  matcher: '/api/:path*',
}
