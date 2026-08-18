import { NextResponse } from 'next/server'
import { isGSCConfigured, listSites, getSiteInfo } from '@/lib/gsc-api'
import { isGSCFullyConfigured } from '@/lib/gsc-config'

export const dynamic = 'force-dynamic'

/**
 * Check Google Search Console connection status.
 * GET /api/gsc/status
 */
export async function GET() {
  const configured = isGSCConfigured()
  const fullyConfigured = isGSCFullyConfigured()

  if (!configured) {
    return NextResponse.json({
      connected: false,
      configured: fullyConfigured,
      message: fullyConfigured
        ? 'Credentials configured but refresh token missing. Complete the OAuth flow.'
        : 'Google Search Console API not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN env vars.',
      authUrl: '/api/gsc/auth/url',
    })
  }

  try {
    const [sites, siteInfo] = await Promise.all([
      listSites(),
      getSiteInfo(),
    ])

    return NextResponse.json({
      connected: true,
      configured: true,
      sites: sites || [],
      siteInfo,
      siteUrl: process.env.GSC_SITE_URL || 'https://seosights.com',
      message: siteInfo?.verified 
        ? 'Connected and verified' 
        : 'Connected but site may not be verified',
    })
  } catch (err) {
    console.error('[GSC status] Error:', err)
    return NextResponse.json({
      connected: false,
      configured: true,
      error: 'Failed to verify GSC connection. Check your refresh token.',
    })
  }
}
