/**
 * Google Search Console API Service
 * 
 * Uses Google OAuth2 + Search Console API to fetch real data.
 * Falls back to mock data when credentials are not configured.
 * 
 * Required env vars (after OAuth setup):
 * - GOOGLE_REFRESH_TOKEN   — OAuth2 refresh token (obtained via OAuth flow)
 * - GSC_SITE_URL           — Site URL in Search Console (e.g. https://seosights.com)
 * 
 * Client ID and Secret are managed via gsc-config.ts
 */

import { getGoogleClientId, getGoogleClientSecret, getGoogleRefreshToken, getGscSiteUrl } from './gsc-config'

// ─── Types ──────────────────────────────────────────────────────────

export interface GSCQueryRow {
  query: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

export interface GSCPageRow {
  url: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

export interface GSCSearchParams {
  siteUrl?: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  dimensions?: string[] // e.g. ['query'] or ['page'] or ['date', 'query']
  rowLimit?: number
  searchType?: 'web' | 'image' | 'video' | 'news' | 'discover'
}

export interface GSCSearchResponse {
  rows: Array<{
    keys: string[]
    impressions: number
    clicks: number
    ctr: number
    position: number
  }>
}

// ─── OAuth2 Token Management ────────────────────────────────────────

let cachedAccessToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  const clientId = getGoogleClientId()
  const clientSecret = getGoogleClientSecret()
  const refreshToken = getGoogleRefreshToken()

  if (!clientId || !clientSecret || !refreshToken) {
    return null
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) {
    return cachedAccessToken.token
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })

    if (!res.ok) {
      console.error('[GSC] Token refresh failed:', await res.text())
      return null
    }

    const data = await res.json()
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    }
    return data.access_token
  } catch (err) {
    console.error('[GSC] Token refresh error:', err)
    return null
  }
}

// ─── Search Console API Calls ───────────────────────────────────────

/**
 * Check if GSC API credentials are configured.
 */
export function isGSCConfigured(): boolean {
  return !!(getGoogleClientId() && getGoogleClientSecret() && getGoogleRefreshToken())
}

/**
 * Fetch search analytics data from Google Search Console API.
 * https://developers.google.com/webmaster-tools/search-console-api-reference/rest/v1/searchanalytics/query
 */
async function querySearchAnalytics(
  params: GSCSearchParams
): Promise<GSCSearchResponse | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) return null

  const siteUrl = params.siteUrl || getGscSiteUrl()

  try {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: params.dimensions || ['query'],
          rowLimit: params.rowLimit || 25,
          searchType: params.searchType || 'web',
        }),
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[GSC] API error:', res.status, errorText)
      return null
    }

    const data = await res.json()
    return data
  } catch (err) {
    console.error('[GSC] API fetch error:', err)
    return null
  }
}

/**
 * List sites verified in Search Console.
 */
export async function listSites(): Promise<string[] | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) return null

  try {
    const res = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) return null

    const data = await res.json()
    return data.siteEntry?.map((s: { siteUrl: string }) => s.siteUrl) || []
  } catch {
    return null
  }
}

/**
 * Get site info from Search Console.
 */
export async function getSiteInfo(siteUrl?: string): Promise<{
  verified: boolean
  siteUrl: string
} | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) return null

  const url = siteUrl || getGscSiteUrl()
  try {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(url)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return { verified: data.permissionLevel !== 'siteUnverifiedUser', siteUrl: data.siteUrl }
  } catch {
    return null
  }
}

// ─── High-level Data Fetchers ───────────────────────────────────────

/**
 * Get top search queries with impressions, clicks, CTR, position.
 */
export async function getTopQueries(
  days: number = 28,
  limit: number = 25,
  siteUrl?: string
): Promise<GSCQueryRow[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  // GSC data has a ~2 day delay
  endDate.setDate(endDate.getDate() - 2)

  const result = await querySearchAnalytics({
    siteUrl,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ['query'],
    rowLimit: limit,
  })

  if (!result?.rows) return []

  return result.rows.map((row) => ({
    query: row.keys[0],
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: Math.round(row.ctr * 10000) / 100, // percentage with 2 decimals
    position: Math.round(row.position * 10) / 10,
  }))
}

/**
 * Get top pages with impressions, clicks, CTR, position.
 */
export async function getTopPages(
  days: number = 28,
  limit: number = 25,
  siteUrl?: string
): Promise<GSCPageRow[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  endDate.setDate(endDate.getDate() - 2)

  const result = await querySearchAnalytics({
    siteUrl,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ['page'],
    rowLimit: limit,
  })

  if (!result?.rows) return []

  return result.rows.map((row) => ({
    url: row.keys[0],
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: Math.round(row.ctr * 10000) / 100,
    position: Math.round(row.position * 10) / 10,
  }))
}

/**
 * Get daily performance over time (impressions + clicks per day).
 */
export async function getPerformanceOverTime(
  days: number = 28,
  siteUrl?: string
): Promise<Array<{ date: string; impressions: number; clicks: number }>> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  endDate.setDate(endDate.getDate() - 2)

  const result = await querySearchAnalytics({
    siteUrl,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ['date'],
    rowLimit: 1000,
  })

  if (!result?.rows) return []

  return result.rows.map((row) => ({
    date: row.keys[0],
    impressions: row.impressions,
    clicks: row.clicks,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get query + page combination data for correlation analysis.
 */
export async function getQueryPageCorrelation(
  days: number = 28,
  limit: number = 50,
  siteUrl?: string
): Promise<Array<{
  query: string; page: string; impressions: number; clicks: number; position: number
}>> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  endDate.setDate(endDate.getDate() - 2)

  const result = await querySearchAnalytics({
    siteUrl,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ['query', 'page'],
    rowLimit: limit,
  })

  if (!result?.rows) return []

  return result.rows.map((row) => ({
    query: row.keys[0],
    page: row.keys[1],
    impressions: row.impressions,
    clicks: row.clicks,
    position: Math.round(row.position * 10) / 10,
  }))
}

/**
 * Get total summary metrics for a period.
 */
export async function getSummaryMetrics(
  days: number = 28,
  siteUrl?: string
): Promise<{
  impressions: number; clicks: number; ctr: number; position: number
} | null> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  endDate.setDate(endDate.getDate() - 2)

  // Query with no dimensions gives totals
  const result = await querySearchAnalytics({
    siteUrl,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: [],
    rowLimit: 1,
  })

  if (!result?.rows?.[0]) return null

  const row = result.rows[0]
  return {
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: Math.round(row.ctr * 10000) / 100,
    position: Math.round(row.position * 10) / 10,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}
