import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * AI Prompt Rank Tracker API
 *
 * GET /api/dashboard/prompt-rank
 *
 * Query params:
 *   - url    (optional) The site/domain being tracked. Echoed back in response.
 *   - prompt (optional) Case-insensitive substring filter on prompt text.
 *
 * Returns mock prompt rank data showing how the tracked brand ranks across
 * four AI models (ChatGPT, Claude, Gemini, Perplexity) for each prompt,
 * including a 4-week rank history per model and aggregate summary metrics.
 */

type Status = 'Mentioned' | 'Cited' | 'Not Mentioned' | 'Partial'
type Sentiment = 'positive' | 'neutral' | 'negative'

interface ModelResult {
  rank: number | null // null = not mentioned
  status: Status
  sentiment: Sentiment
  history: (number | null)[] // 4 weeks of ranks (null = not mentioned that week)
}

interface PromptResult {
  id: string
  text: string
  models: {
    chatgpt: ModelResult
    claude: ModelResult
    gemini: ModelResult
    perplexity: ModelResult
  }
}

// ── Mock data (realistic, believable prompt-tracking dataset) ────────────────
const MOCK_PROMPTS: PromptResult[] = [
  {
    id: 'p1',
    text: 'best SEO tools',
    models: {
      chatgpt: { rank: 3, status: 'Cited', sentiment: 'positive', history: [7, 5, 4, 3] },
      claude: { rank: 5, status: 'Mentioned', sentiment: 'neutral', history: [null, 8, 6, 5] },
      gemini: { rank: 2, status: 'Cited', sentiment: 'positive', history: [6, 4, 3, 2] },
      perplexity: { rank: 1, status: 'Cited', sentiment: 'positive', history: [4, 3, 2, 1] },
    },
  },
  {
    id: 'p2',
    text: 'how to optimize for AI search',
    models: {
      chatgpt: { rank: 4, status: 'Mentioned', sentiment: 'positive', history: [8, 7, 6, 4] },
      claude: { rank: 2, status: 'Cited', sentiment: 'positive', history: [5, 4, 3, 2] },
      gemini: { rank: 6, status: 'Partial', sentiment: 'neutral', history: [9, 8, 7, 6] },
      perplexity: { rank: 3, status: 'Cited', sentiment: 'positive', history: [7, 5, 4, 3] },
    },
  },
  {
    id: 'p3',
    text: 'what is AEO',
    models: {
      chatgpt: { rank: 6, status: 'Partial', sentiment: 'neutral', history: [10, 9, 8, 6] },
      claude: { rank: null, status: 'Not Mentioned', sentiment: 'neutral', history: [null, null, null, null] },
      gemini: { rank: 4, status: 'Mentioned', sentiment: 'positive', history: [7, 6, 5, 4] },
      perplexity: { rank: 5, status: 'Mentioned', sentiment: 'neutral', history: [9, 8, 7, 5] },
    },
  },
  {
    id: 'p4',
    text: 'top GEO software',
    models: {
      chatgpt: { rank: 2, status: 'Cited', sentiment: 'positive', history: [5, 4, 3, 2] },
      claude: { rank: 4, status: 'Mentioned', sentiment: 'positive', history: [8, 7, 6, 4] },
      gemini: { rank: 3, status: 'Cited', sentiment: 'positive', history: [6, 5, 4, 3] },
      perplexity: { rank: 2, status: 'Cited', sentiment: 'positive', history: [4, 3, 3, 2] },
    },
  },
  {
    id: 'p5',
    text: 'AI visibility checker',
    models: {
      chatgpt: { rank: 1, status: 'Cited', sentiment: 'positive', history: [3, 2, 2, 1] },
      claude: { rank: 3, status: 'Cited', sentiment: 'positive', history: [6, 5, 4, 3] },
      gemini: { rank: 7, status: 'Partial', sentiment: 'neutral', history: [10, 9, 8, 7] },
      perplexity: { rank: 2, status: 'Cited', sentiment: 'positive', history: [5, 4, 3, 2] },
    },
  },
  {
    id: 'p6',
    text: 'llms.txt generator',
    models: {
      chatgpt: { rank: 1, status: 'Cited', sentiment: 'positive', history: [2, 2, 1, 1] },
      claude: { rank: 2, status: 'Cited', sentiment: 'positive', history: [4, 3, 2, 2] },
      gemini: { rank: null, status: 'Not Mentioned', sentiment: 'neutral', history: [null, null, 10, null] },
      perplexity: { rank: 1, status: 'Cited', sentiment: 'positive', history: [3, 2, 1, 1] },
    },
  },
]

// ── Summary computation ──────────────────────────────────────────────────────
function computeSummary(prompts: PromptResult[]) {
  const allResults: ModelResult[] = []
  prompts.forEach((p) => Object.values(p.models).forEach((r) => allResults.push(r)))
  const mentioned = allResults.filter((r) => r.rank !== null)
  const avgRank =
    mentioned.length > 0
      ? mentioned.reduce((sum, r) => sum + (r.rank as number), 0) / mentioned.length
      : 0
  const mentionRate =
    allResults.length > 0 ? (mentioned.length / allResults.length) * 100 : 0
  // Trend = average rank per week across all models/prompts (lower = better)
  const trend: (number | null)[] = [0, 1, 2, 3].map((weekIdx) => {
    const weekRanks = allResults
      .map((r) => r.history[weekIdx])
      .filter((v): v is number => v !== null)
    return weekRanks.length > 0
      ? Math.round((weekRanks.reduce((a, b) => a + b, 0) / weekRanks.length) * 10) / 10
      : null
  })
  return { avgRank, mentionRate, trend }
}

// ── GET handler ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const prompt = searchParams.get('prompt')

    let prompts = MOCK_PROMPTS
    if (prompt && prompt.trim().length > 0) {
      const q = prompt.toLowerCase()
      prompts = MOCK_PROMPTS.filter((p) => p.text.toLowerCase().includes(q))
    }

    const summary = computeSummary(prompts)

    return NextResponse.json({
      prompts,
      summary,
      ...(url ? { url } : {}),
    })
  } catch (error) {
    console.error(
      '[prompt-rank] GET error:',
      error instanceof Error ? error.message : 'Unknown'
    )
    return NextResponse.json(
      { error: 'Failed to fetch prompt rank data' },
      { status: 500 }
    )
  }
}
