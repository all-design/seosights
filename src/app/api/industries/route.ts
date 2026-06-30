import { NextRequest, NextResponse } from 'next/server'
import { industries, Industry } from '@/data/industries-data'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Parse query params
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  let result: Industry[] = [...industries]

  // Filter by category
  if (category && category !== 'All') {
    result = result.filter((i) => i.category === category)
  }

  // Filter by search term
  if (search && search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    )
  }

  // Build response
  const response = NextResponse.json({
    industries: result,
    total: result.length,
  })

  // Set cache and CORS headers
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
