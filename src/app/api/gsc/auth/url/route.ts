import { NextRequest, NextResponse } from 'next/server'

/**
 * Generate Google OAuth2 authorization URL for Search Console.
 * 
 * GET /api/gsc/auth/url?returnTo=/dashboard
 * → Returns { url: "https://accounts.google.com/o/oauth2/v2/auth?..." }
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
]

export async function GET(request: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ 
      error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.' 
    }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const returnTo = searchParams.get('returnTo') || '/dashboard'

  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/gsc/auth/callback`

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', GSC_SCOPES.join(' '))
  authUrl.searchParams.set('access_type', 'offline') // Required for refresh token
  authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token
  authUrl.searchParams.set('state', returnTo)

  return NextResponse.json({ url: authUrl.toString() })
}
