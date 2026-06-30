import { NextRequest, NextResponse } from 'next/server'
import { directoryCompanies, DirectoryCompany } from '@/data/directory-data'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Parse query params
  const industry = searchParams.get('industry')
  const location = searchParams.get('location')
  const engine = searchParams.get('engine')
  const sort = searchParams.get('sort') ?? 'aiVisibilityScore'
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  const search = searchParams.get('search')

  // Start with full dataset
  let result: DirectoryCompany[] = [...directoryCompanies]

  // Filter by search term
  if (search && search.trim()) {
    const q = search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    )
  }

  // Filter by industry
  if (industry && industry !== 'All') {
    result = result.filter((c) => c.industry === industry)
  }

  // Filter by location
  if (location && location !== 'Global') {
    if (location === 'Europe') {
      result = result.filter((c) =>
        ['UK', 'Germany', 'France', 'Switzerland', 'Serbia', 'Croatia'].includes(c.location)
      )
    } else {
      result = result.filter((c) => c.location === location)
    }
  }

  // Filter by AI engine (only include companies with score >= 70 for that engine)
  if (engine) {
    const engineKeyMap: Record<string, keyof DirectoryCompany> = {
      chatgpt: 'chatgptScore',
      claude: 'claudeScore',
      gemini: 'geminiScore',
      perplexity: 'perplexityScore',
    }
    const engineKey = engineKeyMap[engine.toLowerCase()]
    if (engineKey) {
      result = result.filter((c) => (c[engineKey] as number) >= 70)
    }
  }

  // Sort
  const validSortKeys: (keyof DirectoryCompany)[] = [
    'aiVisibilityScore',
    'chatgptScore',
    'claudeScore',
    'geminiScore',
    'perplexityScore',
    'recommendationRate',
    'citations',
    'trend',
    'name',
  ]
  const sortKey = validSortKeys.includes(sort as keyof DirectoryCompany)
    ? (sort as keyof DirectoryCompany)
    : 'aiVisibilityScore'

  result.sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal)
    }
    return (bVal as number) - (aVal as number)
  })

  // Pagination
  const total = result.length
  const paginated = result.slice(offset, offset + limit)

  // Build response
  const response = NextResponse.json({
    companies: paginated,
    total,
    limit,
    offset,
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
