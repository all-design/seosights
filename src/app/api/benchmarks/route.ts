import { NextRequest, NextResponse } from 'next/server'
import { industryBenchmarks, BenchmarkCompany } from '@/data/benchmarks-data'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Parse query params
  const industry = searchParams.get('industry')
  const limit = parseInt(searchParams.get('limit') ?? '10', 10)

  let result = [...industryBenchmarks]

  // Filter by industry slug
  if (industry) {
    result = result.filter((b) => b.slug === industry)
  }

  // Apply limit to each industry's companies list
  result = result.map((b) => ({
    ...b,
    companies: b.companies.slice(0, limit) as BenchmarkCompany[],
  }))

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
