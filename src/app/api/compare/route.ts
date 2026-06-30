import { NextRequest, NextResponse } from 'next/server'
import { competitors, features, tableHeaders } from '@/data/compare-data'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Parse query params
  const competitor = searchParams.get('competitor')

  // If a specific competitor slug is requested, return that competitor's comparison data
  if (competitor) {
    const comp = competitors.find((c) => c.slug === competitor)
    if (!comp) {
      return NextResponse.json(
        { error: 'Competitor not found', availableSlugs: competitors.map((c) => c.slug) },
        { status: 404 }
      )
    }

    // Find the feature data key for this competitor
    const compKey = competitor.replace(/-/g, '_')

    // Build comparison features for just this competitor vs SeoSights
    const comparisonFeatures = features.map((f) => ({
      name: f.name,
      icon: f.icon,
      seosights: f.data.seosights,
      competitor: f.data[compKey] ?? false,
    }))

    const response = NextResponse.json({
      competitor: comp,
      features: comparisonFeatures,
    })

    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  }

  // No specific competitor — return full comparison data
  const response = NextResponse.json({
    competitors,
    features,
    tableHeaders,
  })

  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return response
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
