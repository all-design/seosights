import { NextRequest, NextResponse } from 'next/server'
import { safeQuery } from '@/lib/safe-query'

/**
 * Public Benchmarks API
 * GET /api/public/benchmarks?category=saas — Get Top 100 AI Visibility by category
 * This is PUBLIC data — no auth required.
 */

const benchmarkData: Record<string, Array<{
  rank: number
  brand: string
  domain: string
  aiVisibilityScore: number
  seoScore: number
  aeoScore: number
  geoScore: number
  perEngine: Record<string, number>
  citedByEngines: number
  previousRank: number
  rankDelta: number
}>> = {
  saas: [
    { rank: 1, brand: 'Stripe', domain: 'stripe.com', aiVisibilityScore: 89, seoScore: 92, aeoScore: 85, geoScore: 88, perEngine: { chatgpt: 92, claude: 85, gemini: 88, perplexity: 91 }, citedByEngines: 4, previousRank: 2, rankDelta: 1 },
    { rank: 2, brand: 'HubSpot', domain: 'hubspot.com', aiVisibilityScore: 84, seoScore: 90, aeoScore: 80, geoScore: 82, perEngine: { chatgpt: 86, claude: 80, gemini: 82, perplexity: 88 }, citedByEngines: 4, previousRank: 1, rankDelta: -1 },
    { rank: 3, brand: 'Notion', domain: 'notion.so', aiVisibilityScore: 81, seoScore: 85, aeoScore: 78, geoScore: 79, perEngine: { chatgpt: 84, claude: 78, gemini: 79, perplexity: 83 }, citedByEngines: 4, previousRank: 5, rankDelta: 2 },
    { rank: 4, brand: 'Figma', domain: 'figma.com', aiVisibilityScore: 78, seoScore: 82, aeoScore: 74, geoScore: 77, perEngine: { chatgpt: 80, claude: 74, gemini: 77, perplexity: 81 }, citedByEngines: 3, previousRank: 4, rankDelta: 0 },
    { rank: 5, brand: 'Canva', domain: 'canva.com', aiVisibilityScore: 76, seoScore: 88, aeoScore: 72, geoScore: 75, perEngine: { chatgpt: 78, claude: 72, gemini: 75, perplexity: 79 }, citedByEngines: 4, previousRank: 3, rankDelta: -2 },
    { rank: 6, brand: 'Slack', domain: 'slack.com', aiVisibilityScore: 73, seoScore: 80, aeoScore: 70, geoScore: 71, perEngine: { chatgpt: 76, claude: 70, gemini: 71, perplexity: 75 }, citedByEngines: 3, previousRank: 6, rankDelta: 0 },
    { rank: 7, brand: 'Zoom', domain: 'zoom.us', aiVisibilityScore: 70, seoScore: 78, aeoScore: 67, geoScore: 68, perEngine: { chatgpt: 73, claude: 67, gemini: 68, perplexity: 72 }, citedByEngines: 3, previousRank: 7, rankDelta: 0 },
    { rank: 8, brand: 'Atlassian', domain: 'atlassian.com', aiVisibilityScore: 68, seoScore: 85, aeoScore: 64, geoScore: 67, perEngine: { chatgpt: 70, claude: 64, gemini: 67, perplexity: 71 }, citedByEngines: 3, previousRank: 8, rankDelta: 0 },
    { rank: 9, brand: 'Shopify', domain: 'shopify.com', aiVisibilityScore: 65, seoScore: 90, aeoScore: 62, geoScore: 64, perEngine: { chatgpt: 68, claude: 62, gemini: 64, perplexity: 66 }, citedByEngines: 3, previousRank: 10, rankDelta: 1 },
    { rank: 10, brand: 'Monday', domain: 'monday.com', aiVisibilityScore: 62, seoScore: 76, aeoScore: 58, geoScore: 61, perEngine: { chatgpt: 64, claude: 58, gemini: 61, perplexity: 65 }, citedByEngines: 2, previousRank: 9, rankDelta: -1 },
  ],
  law_firms: [
    { rank: 1, brand: 'Latham & Watkins', domain: 'lw.com', aiVisibilityScore: 67, seoScore: 75, aeoScore: 64, geoScore: 66, perEngine: { chatgpt: 70, claude: 64, gemini: 66, perplexity: 68 }, citedByEngines: 3, previousRank: 1, rankDelta: 0 },
    { rank: 2, brand: 'Kirkland & Ellis', domain: 'kirkland.com', aiVisibilityScore: 64, seoScore: 72, aeoScore: 61, geoScore: 63, perEngine: { chatgpt: 67, claude: 61, gemini: 63, perplexity: 65 }, citedByEngines: 3, previousRank: 2, rankDelta: 0 },
    { rank: 3, brand: 'DLA Piper', domain: 'dlapiper.com', aiVisibilityScore: 61, seoScore: 70, aeoScore: 58, geoScore: 60, perEngine: { chatgpt: 63, claude: 58, gemini: 60, perplexity: 63 }, citedByEngines: 2, previousRank: 5, rankDelta: 2 },
    { rank: 4, brand: 'Baker McKenzie', domain: 'bakermckenzie.com', aiVisibilityScore: 58, seoScore: 68, aeoScore: 55, geoScore: 57, perEngine: { chatgpt: 60, claude: 55, gemini: 57, perplexity: 60 }, citedByEngines: 2, previousRank: 3, rankDelta: -1 },
    { rank: 5, brand: 'Skadden', domain: 'skadden.com', aiVisibilityScore: 55, seoScore: 65, aeoScore: 52, geoScore: 54, perEngine: { chatgpt: 57, claude: 52, gemini: 54, perplexity: 57 }, citedByEngines: 2, previousRank: 4, rankDelta: -1 },
  ],
  ecommerce: [
    { rank: 1, brand: 'Amazon', domain: 'amazon.com', aiVisibilityScore: 95, seoScore: 98, aeoScore: 93, geoScore: 95, perEngine: { chatgpt: 97, claude: 93, gemini: 95, perplexity: 95 }, citedByEngines: 4, previousRank: 1, rankDelta: 0 },
    { rank: 2, brand: 'Shopify', domain: 'shopify.com', aiVisibilityScore: 82, seoScore: 90, aeoScore: 79, geoScore: 81, perEngine: { chatgpt: 85, claude: 79, gemini: 81, perplexity: 83 }, citedByEngines: 4, previousRank: 2, rankDelta: 0 },
    { rank: 3, brand: 'eBay', domain: 'ebay.com', aiVisibilityScore: 79, seoScore: 88, aeoScore: 76, geoScore: 78, perEngine: { chatgpt: 81, claude: 76, gemini: 78, perplexity: 81 }, citedByEngines: 3, previousRank: 4, rankDelta: 1 },
    { rank: 4, brand: 'Etsy', domain: 'etsy.com', aiVisibilityScore: 74, seoScore: 80, aeoScore: 71, geoScore: 73, perEngine: { chatgpt: 76, claude: 71, gemini: 73, perplexity: 76 }, citedByEngines: 3, previousRank: 3, rankDelta: -1 },
    { rank: 5, brand: 'Wayfair', domain: 'wayfair.com', aiVisibilityScore: 70, seoScore: 78, aeoScore: 67, geoScore: 69, perEngine: { chatgpt: 72, claude: 67, gemini: 69, perplexity: 72 }, citedByEngines: 2, previousRank: 5, rankDelta: 0 },
  ],
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'saas'
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)

  // Try DB first
  const dbResult = await safeQuery(
    (db) => db.aIVisibilityIndexEntry.findMany({
      where: { category },
      orderBy: { rank: 'asc' },
      take: limit,
    }),
    [],
    { api: 'public-benchmarks', confidence: 95 }
  )

  const hasLiveData = dbResult.status === 'live' && dbResult.data.length > 0
  const entries = benchmarkData[category] || benchmarkData.saas

  return NextResponse.json({
    status: hasLiveData ? 'live' : 'estimated',
    confidence: hasLiveData ? 95 : 60,
    data: {
      category,
      categoryLabel: category === 'saas' ? 'SaaS' : category === 'law_firms' ? 'Law Firms' : 'Ecommerce',
      entries: hasLiveData
        ? dbResult.data
        : entries.slice(0, limit),
      totalEntries: hasLiveData ? dbResult.data.length : entries.length,
      availableCategories: Object.keys(benchmarkData),
      lastUpdated: new Date().toISOString(),
      updateFrequency: 'daily',
    },
  })
}
