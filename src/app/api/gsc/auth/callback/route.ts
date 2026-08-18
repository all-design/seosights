import { NextRequest, NextResponse } from 'next/server'
import { getGoogleClientId, getGoogleClientSecret } from '@/lib/gsc-config'

/**
 * Google OAuth2 callback for Search Console integration.
 * 
 * Flow:
 * 1. User clicks "Connect Search Console" → /api/gsc/auth/url generates OAuth URL
 * 2. User authorizes in Google → redirects here with ?code=...
 * 3. We exchange code for tokens → display refresh token for admin
 * 4. Redirect back to dashboard
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state') // return URL

  if (error) {
    const returnTo = state || '/dashboard'
    return NextResponse.redirect(new URL(`${returnTo}?gsc_error=${encodeURIComponent(error)}`, request.url))
  }

  const clientId = getGoogleClientId()
  const clientSecret = getGoogleClientSecret()

  if (!code || !clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing authorization code or Google credentials' }, { status: 400 })
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'https://seosights.com/api/gsc/auth/callback',
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('[GSC OAuth] Token exchange failed:', errText)
      return NextResponse.json({ error: 'Token exchange failed', details: errText }, { status: 500 })
    }

    const tokens = await tokenRes.json()
    const refreshToken = tokens.refresh_token

    if (!refreshToken) {
      console.error('[GSC OAuth] No refresh token received.')
      return NextResponse.json({ 
        error: 'No refresh token received. Please revoke access in Google Account settings and try again.' 
      }, { status: 400 })
    }

    const returnTo = state || '/control/settings'

    // Display the refresh token for admin to configure as env var
    const html = `<!DOCTYPE html>
<html>
<head><title>GSC Connected</title>
<style>
body{font-family:system-ui;max-width:640px;margin:80px auto;padding:0 20px;background:#0a0a0a;color:#e5e5e5}
.success{color:#10b981;font-size:1.2em;margin-bottom:1em}
.code{background:#1e1e1e;border:1px solid #333;padding:12px;border-radius:8px;font-family:monospace;word-break:break-all;margin:1em 0}
.btn{display:inline-block;padding:10px 24px;background:#10b981;color:white;text-decoration:none;border-radius:8px;margin-top:1em}
.warn{color:#f59e0b;font-size:0.9em}
</style></head>
<body>
<h1 class="success">✅ Google Search Console Connected!</h1>
<p>Your refresh token has been generated. Add it as an environment variable on Vercel:</p>
<div class="code">GOOGLE_REFRESH_TOKEN=${refreshToken}</div>
<p class="warn">⚠️ Store this securely! This token grants read access to your Search Console data.</p>
<p>Also ensure these env vars are set on Vercel:</p>
<div class="code">GOOGLE_CLIENT_ID=${clientId}
GOOGLE_CLIENT_SECRET=***hidden***
GOOGLE_REFRESH_TOKEN=${refreshToken}
GSC_SITE_URL=https://seosights.com</div>
<a href="${returnTo}" class="btn">Continue to Dashboard →</a>
</body></html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (err) {
    console.error('[GSC OAuth] Callback error:', err)
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 })
  }
}
