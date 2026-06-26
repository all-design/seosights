import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Competitor Citation Gap API
 *
 * GET /api/dashboard/competitor-citation?url=example.com
 *
 * Returns a mock comparison matrix of how often each AI model
 * (ChatGPT, Claude, Gemini, Perplexity, Copilot) cites "you" vs.
 * your competitors, plus insights and a summary.
 */

// ── Types ────────────────────────────────────────────────────────
type ModelKey = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'copilot'

interface CompetitorRow {
  domain: string
  isYou: boolean
  citations: Record<ModelKey, number>
}

type InsightType = 'gap' | 'strength' | 'risk' | 'opportunity'
type Severity = 'rose' | 'amber' | 'emerald'

interface Insight {
  type: InsightType
  message: string
  severity: Severity
}

interface Summary {
  yourRank: number
  totalMentions: number
  gapToLeader: number
}

interface ResponseShape {
  competitors: CompetitorRow[]
  insights: Insight[]
  summary: Summary
}

// ── Mock Data Builders ───────────────────────────────────────────
function normalizeDomain(url?: string): string {
  if (!url) return 'yoursite.com'
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
    .trim() || 'yoursite.com'
}

function buildCompetitors(url?: string): CompetitorRow[] {
  const youDomain = normalizeDomain(url)
  return [
    {
      domain: youDomain,
      isYou: true,
      citations: { chatgpt: 47, claude: 31, gemini: 28, perplexity: 89, copilot: 0 },
    },
    {
      domain: 'ahrefs.com',
      isYou: false,
      citations: { chatgpt: 142, claude: 96, gemini: 78, perplexity: 134, copilot: 67 },
    },
    {
      domain: 'semrush.com',
      isYou: false,
      citations: { chatgpt: 118, claude: 88, gemini: 64, perplexity: 78, copilot: 58 },
    },
    {
      domain: 'surferseo.com',
      isYou: false,
      citations: { chatgpt: 76, claude: 54, gemini: 41, perplexity: 67, copilot: 35 },
    },
    {
      domain: 'fractle.com',
      isYou: false,
      citations: { chatgpt: 38, claude: 22, gemini: 18, perplexity: 45, copilot: 12 },
    },
  ]
}

const INSIGHTS: Insight[] = [
  { type: 'gap', message: "You're cited 3x less than Ahrefs on ChatGPT", severity: 'rose' },
  { type: 'strength', message: 'Strong on Perplexity — 2nd most cited', severity: 'emerald' },
  { type: 'risk', message: 'Missing entirely from Copilot', severity: 'rose' },
  { type: 'opportunity', message: 'Claude cites competitors 2x more than you', severity: 'amber' },
]

function summarize(competitors: CompetitorRow[]): Summary {
  const totals = competitors
    .map((c) => ({
      isYou: c.isYou,
      total: Object.values(c.citations).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total)

  const yourIdx = totals.findIndex((t) => t.isYou)
  const yourTotal = totals.find((t) => t.isYou)?.total ?? 0
  const leaderTotal = totals[0]?.total ?? 0

  return {
    yourRank: yourIdx >= 0 ? yourIdx + 1 : 0,
    totalMentions: yourTotal,
    gapToLeader: yourTotal - leaderTotal,
  }
}

// ── GET Handler ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url') ?? undefined

  const competitors = buildCompetitors(url)
  const summary = summarize(competitors)

  const payload: ResponseShape = {
    competitors,
    insights: INSIGHTS,
    summary,
  }

  return NextResponse.json(payload)
}
