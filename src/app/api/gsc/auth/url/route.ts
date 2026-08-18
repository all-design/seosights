import { NextRequest, NextResponse } from 'next/server'
import { getGoogleClientId } from '@/lib/gsc-config'

/**
 * Generate Google OAuth2 authorization URL for Search Console.
 * 
 * GET /api/gsc/auth/url?returnTo=/dashboard
 * → Returns { url: "https://accounts.google.com/o/oauth2/v2/auth?..." }
 */

const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
]

export async function GET(request: NextRequest) {
  const clientId = getGoogleClientId()
  
  if (!clientId) {
    return NextResponse.json({ 
      error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.' 
    }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const returnTo = searchParams.get('returnTo') || '/dashboard'

  // Use production redirect URI
  const redirectUri = 'https://seosights.com/api/gsc/auth/callback'

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', GSC_SCOPES.join(' '))
  authUrl.searchParams.set('access_type', 'offline') // Required for refresh token
  authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token
  authUrl.searchParams.set('state', returnTo)

  return NextResponse.json({ url: authUrl.toString() })
}
