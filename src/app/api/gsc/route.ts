import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteUrl, accessToken } = body

    if (!siteUrl) {
      return NextResponse.json({ error: 'Site URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      const url = new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`)
      if (!url.hostname || url.hostname === 'localhost') {
        throw new Error('Invalid hostname')
      }
    } catch {
      return NextResponse.json({ error: 'Please enter a valid site URL (e.g., https://example.com)' }, { status: 400 })
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required for GSC connection' }, { status: 400 })
    }

    // Mock GSC data (since we can't actually connect to GSC without OAuth)
    const domain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

    const mockData = {
      connected: true,
      siteUrl,
      domain,
      connectedAt: new Date().toISOString(),
      topQueries: [
        { query: `${domain} pricing`, impressions: 12400, clicks: 890, ctr: 7.18, position: 3.2, aiCitation: true, aiEngines: ['ChatGPT', 'Perplexity'] },
        { query: `${domain} vs competitors`, impressions: 8900, clicks: 672, ctr: 7.55, position: 2.8, aiCitation: true, aiEngines: ['Claude', 'Gemini'] },
        { query: `best ${domain.split('.')[0]} alternative`, impressions: 6700, clicks: 412, ctr: 6.15, position: 4.1, aiCitation: false, aiEngines: [] },
        { query: `${domain} review`, impressions: 5800, clicks: 389, ctr: 6.71, position: 3.5, aiCitation: true, aiEngines: ['Perplexity'] },
        { query: `how to use ${domain.split('.')[0]}`, impressions: 4500, clicks: 298, ctr: 6.62, position: 5.2, aiCitation: false, aiEngines: [] },
        { query: `${domain} features`, impressions: 3900, clicks: 245, ctr: 6.28, position: 4.8, aiCitation: true, aiEngines: ['ChatGPT', 'Gemini'] },
        { query: `${domain.split('.')[0]} tutorial`, impressions: 3200, clicks: 198, ctr: 6.19, position: 6.1, aiCitation: false, aiEngines: [] },
        { query: `${domain} free trial`, impressions: 2800, clicks: 224, ctr: 8.0, position: 2.1, aiCitation: true, aiEngines: ['Claude'] },
        { query: `${domain} integration`, impressions: 2100, clicks: 134, ctr: 6.38, position: 5.8, aiCitation: false, aiEngines: [] },
        { query: `${domain.split('.')[0]} SEO tool`, impressions: 1800, clicks: 156, ctr: 8.67, position: 1.9, aiCitation: true, aiEngines: ['ChatGPT', 'Perplexity', 'Gemini'] },
      ],
      topPages: [
        { url: `${siteUrl}/`, impressions: 45000, clicks: 3200, ctr: 7.11, position: 2.4 },
        { url: `${siteUrl}/pricing`, impressions: 12400, clicks: 890, ctr: 7.18, position: 3.2 },
        { url: `${siteUrl}/features`, impressions: 8900, clicks: 672, ctr: 7.55, position: 2.8 },
        { url: `${siteUrl}/blog`, impressions: 6700, clicks: 412, ctr: 6.15, position: 4.1 },
        { url: `${siteUrl}/docs`, impressions: 5800, clicks: 389, ctr: 6.71, position: 3.5 },
      ],
      crawlErrors: [
        { url: `${siteUrl}/old-page`, type: '404 Not Found', lastCrawled: '2025-02-28', occurrences: 45 },
        { url: `${siteUrl}/deprecated-api`, type: 'Soft 404', lastCrawled: '2025-03-01', occurrences: 12 },
        { url: `${siteUrl}/redirect-loop`, type: 'Redirect Error', lastCrawled: '2025-03-02', occurrences: 8 },
      ],
      indexingStatus: {
        totalPages: 248,
        indexedPages: 212,
        pendingPages: 18,
        excludedPages: 18,
        coverage: 85.5,
      },
      performanceOverTime: Array.from({ length: 28 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (27 - i))
        return {
          date: date.toISOString().split('T')[0],
          impressions: Math.round(3000 + Math.random() * 2000 + i * 50),
          clicks: Math.round(200 + Math.random() * 150 + i * 5),
        }
      }),
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('GSC connection error:', error)
    return NextResponse.json({ error: 'Failed to connect Google Search Console' }, { status: 500 })
  }
}
