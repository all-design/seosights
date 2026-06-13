import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/cms/test-connection
 * Tests WordPress REST API connection with provided credentials
 *
 * Body: {
 *   siteUrl: string
 *   username: string
 *   applicationPassword: string
 * }
 */

interface TestConnectionRequestBody {
  siteUrl: string
  username: string
  applicationPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TestConnectionRequestBody = await request.json()
    const { siteUrl, username, applicationPassword } = body

    // ── Validate required fields ──────────────────────────────────────
    if (!siteUrl || !username || !applicationPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'siteUrl, username, and applicationPassword are required',
        },
        { status: 400 }
      )
    }

    // ── Create Base64 auth header ────────────────────────────────────
    const authString = Buffer.from(`${username}:${applicationPassword}`).toString('base64')

    // ── Build WordPress REST API URL ─────────────────────────────────
    const normalizedUrl = siteUrl.replace(/\/+$/, '') // trim trailing slashes
    const wpApiUrl = `${normalizedUrl}/wp-json/wp/v2/users/me`

    console.log(`[CMS Test] Testing WordPress connection: ${wpApiUrl}`)

    // ── GET request with 15-second timeout ───────────────────────────
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)

    let wpResponse: Response
    try {
      wpResponse = await fetch(wpApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const message =
        fetchError instanceof DOMException && fetchError.name === 'AbortError'
          ? 'Connection to WordPress timed out after 15 seconds'
          : 'Failed to connect to WordPress site. Please check the site URL.'

      console.error('[CMS Test] Fetch error:', message)

      return NextResponse.json(
        { success: false, error: message },
        { status: 502 }
      )
    } finally {
      clearTimeout(timeoutId)
    }

    // ── Handle WordPress response ────────────────────────────────────
    if (!wpResponse.ok) {
      let errorDetail: string
      try {
        const errorBody = await wpResponse.json()
        errorDetail =
          errorBody?.message ||
          errorBody?.code ||
          `WordPress returned status ${wpResponse.status}`
      } catch {
        errorDetail = `WordPress returned status ${wpResponse.status}`
      }

      console.error('[CMS Test] WordPress error:', wpResponse.status, errorDetail)

      if (wpResponse.status === 401 || wpResponse.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication failed. Please verify your username and application password.',
          },
          { status: 401 }
        )
      }

      if (wpResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: 'WordPress REST API not found. Please ensure the site URL is correct and REST API is enabled.',
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { success: false, error: `WordPress API error: ${errorDetail}` },
        { status: 502 }
      )
    }

    // ── Parse successful response ────────────────────────────────────
    const userData = await wpResponse.json() as {
      name?: string
      roles?: string[]
      slug?: string
      description?: string
    }

    const siteName = userData.name || username
    const userRole = userData.roles?.[0] || 'unknown'

    console.log(`[CMS Test] Connection successful: user="${siteName}", role="${userRole}"`)

    return NextResponse.json({
      success: true,
      siteName,
      userRole,
      username: userData.slug || username,
    })
  } catch (error) {
    console.error('[CMS Test] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while testing the connection' },
      { status: 500 }
    )
  }
}
