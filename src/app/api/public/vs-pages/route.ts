import { NextRequest, NextResponse } from 'next/server'
import { safeQuery } from '@/lib/safe-query'

/**
 * VS Pages API (Public Comparison Pages)
 * GET /api/public/vs-pages — Get all comparison pages
 * GET /api/public/vs-pages?competitor=ahrefs — Get specific comparison
 */

const vsData: Record<string, {
  competitorKey: string
  competitorName: string
  competitorUrl: string
  seosightsScore: number
  competitorScore: number
  seosightsFeatures: string[]
  competitorFeatures: string[]
  keyDifferences: string[]
  whyBetter: string[]
  metaTitle: string
  metaDescription: string
  monthlySearchVolume: number
}> = {
  ahrefs: {
    competitorKey: 'ahrefs',
    competitorName: 'Ahrefs',
    competitorUrl: 'https://ahrefs.com',
    seosightsScore: 92,
    competitorScore: 78,
    seosightsFeatures: ['AI Visibility Score', 'AI citation tracking', 'llms.txt generator', 'Recommendation Simulator', 'Auto Execute', '8-Agent AI Engine', 'Citation Explorer', 'AI Replay'],
    competitorFeatures: ['Backlink data', 'Keyword research', 'Rank tracking', 'Site audit', 'Content explorer'],
    keyDifferences: [
      'Seosights tracks AI citations across ChatGPT, Claude, Gemini & Perplexity — Ahrefs doesn\'t',
      'Seosights has an AI Visibility Score — Ahrefs only has traditional SEO metrics',
      'Seosights auto-executes fixes — Ahrefs only reports issues',
      'Seosights monitors AI engine recommendations — Ahrefs monitors Google SERPs only',
    ],
    whyBetter: [
      'AI search is growing 10x faster than traditional search',
      'Seosights tells you what to do, not just what\'s wrong',
      'Auto Execute saves 5+ hours/week vs manual fixes',
      'Real-time AI citation monitoring catches problems before they hurt',
    ],
    metaTitle: 'Seosights vs Ahrefs — AI Visibility vs Traditional SEO Tracking',
    metaDescription: 'Ahrefs tracks backlinks. Seosights tracks AI recommendations. See why AI Visibility is the metric that matters in 2025.',
    monthlySearchVolume: 2400,
  },
  semrush: {
    competitorKey: 'semrush',
    competitorName: 'Semrush',
    competitorUrl: 'https://semrush.com',
    seosightsScore: 92,
    competitorScore: 82,
    seosightsFeatures: ['AI Visibility Score', 'Per-engine tracking', 'AI Replay', 'Citation Explorer', 'Auto Execute', 'AI Recommendation Engine', 'Mission Control', 'Score Delta'],
    competitorFeatures: ['SEO toolkit', 'Content marketing', 'PPC data', 'Social media management', 'Keyword research'],
    keyDifferences: [
      'Semrush sees traditional search. Seosights sees AI search — the channel growing 10x faster',
      'Seosights tracks how AI engines recommend you — Semrush tracks Google rankings only',
      'Seosights has Auto Execute — Semrush requires manual implementation',
      'Seosights monitors 5 AI engines — Semrush monitors 1 search engine',
    ],
    whyBetter: [
      'AI recommendations drive higher intent traffic than traditional SERPs',
      'Auto Execute means you improve while competitors just monitor',
      '8-agent AI engine provides deeper analysis than single-model tools',
    ],
    metaTitle: 'Seosights vs Semrush — AI Visibility Intelligence vs Traditional SEO Suite',
    metaDescription: 'Semrush is built for Google. Seosights is built for AI. Compare features, pricing, and see why AI Visibility is the new SEO.',
    monthlySearchVolume: 3200,
  },
  surfer: {
    competitorKey: 'surfer',
    competitorName: 'Surfer SEO',
    competitorUrl: 'https://surferseo.com',
    seosightsScore: 92,
    competitorScore: 65,
    seosightsFeatures: ['AI Visibility Score', '8-Agent AI analysis', 'AI Replay & Recorder', 'Auto Execute', 'Citation tracking', 'Entity optimization', 'Mission Control', 'AI Digest'],
    competitorFeatures: ['Content editor', 'SERP analyzer', 'Keyword planner', 'AI writing'],
    keyDifferences: [
      'Surfer optimizes content for Google. Seosights optimizes for AI — where buyers now go first',
      'Seosights has 8 AI agents for multi-dimensional analysis — Surfer has content editing only',
      'Seosights tracks AI citations — Surfer doesn\'t',
      'Seosights auto-executes improvements — Surfer requires manual writing',
    ],
    whyBetter: [
      'AI-first optimization > SERP-first optimization in 2025',
      '8-agent system provides 360° analysis vs single-dimension content editing',
      'Auto Execute turns recommendations into results automatically',
    ],
    metaTitle: 'Seosights vs Surfer SEO — AI Visibility vs Content Optimization',
    metaDescription: 'Surfer SEO edits content. Seosights makes AI engines recommend you. Compare the two and see why AI Visibility is the future.',
    monthlySearchVolume: 1800,
  },
  profound: {
    competitorKey: 'profound',
    competitorName: 'Profound',
    competitorUrl: 'https://profound.co',
    seosightsScore: 92,
    competitorScore: 58,
    seosightsFeatures: ['AI Visibility Score', 'Action recommendations', 'Auto Execute', '8-Agent AI Engine', 'Mission Control', 'Citation Explorer', 'AI Replay', 'Score Delta tracking'],
    competitorFeatures: ['AI mention tracking', 'Basic analytics', 'Alerts'],
    keyDifferences: [
      'Profound tracks AI mentions. Seosights goes further — it tells you exactly what to do and auto-executes',
      'Seosights has 8 AI agents for deep analysis — Profound is primarily a monitoring tool',
      'Seosights has Auto Execute — Profound only reports',
      'Seosights tracks score delta per action — Profound shows mentions only',
    ],
    whyBetter: [
      'Monitoring without action is just observation',
      'Auto Execute turns insights into results in minutes, not weeks',
      'Score Delta tracking proves ROI of every action',
    ],
    metaTitle: 'Seosights vs Profound — AI Visibility Action vs AI Monitoring',
    metaDescription: 'Profound monitors AI mentions. Seosights monitors AND improves your AI Visibility. Compare features and see the difference.',
    monthlySearchVolume: 320,
  },
  goodie: {
    competitorKey: 'goodie',
    competitorName: 'Goodie',
    competitorUrl: 'https://goodie.ai',
    seosightsScore: 92,
    competitorScore: 52,
    seosightsFeatures: ['AI Visibility Score', 'Auto Execute', '8-Agent AI Engine', 'Score Delta tracking', 'Full audit suite', 'CMS integration', 'Citation Explorer', 'AI Replay'],
    competitorFeatures: ['AI answer monitoring', 'Basic alerts', 'Mention tracking'],
    keyDifferences: [
      'Goodie monitors AI answers. Seosights actively improves your position in them',
      'Seosights has a full 8-agent analysis engine — Goodie is monitoring-only',
      'Seosights auto-executes improvements — Goodie only reports what AI says',
      'Seosights has CMS integrations for direct publishing — Goodie doesn\'t',
    ],
    whyBetter: [
      'Active optimization > passive monitoring',
      '8-agent analysis provides actionable recommendations, not just observations',
      'CMS integration means changes go live in minutes',
    ],
    metaTitle: 'Seosights vs Goodie — AI Visibility Optimization vs AI Monitoring',
    metaDescription: 'Goodie watches AI answers. Seosights changes them. Compare features and see why active AI Visibility optimization wins.',
    monthlySearchVolume: 210,
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const competitor = searchParams.get('competitor')

  if (competitor) {
    const data = vsData[competitor]
    if (!data) {
      return NextResponse.json({ error: `No comparison data for "${competitor}". Available: ${Object.keys(vsData).join(', ')}` }, { status: 404 })
    }

    // Try DB first
    const dbResult = await safeQuery(
      (db) => db.vSPage.findUnique({ where: { competitorKey: competitor } }),
      null,
      { api: 'public-vs-pages', confidence: 95 }
    )

    return NextResponse.json({
      status: dbResult?.status === 'live' && dbResult.data ? 'live' : 'estimated',
      confidence: dbResult?.status === 'live' && dbResult.data ? 95 : 65,
      data: dbResult?.status === 'live' && dbResult.data ? dbResult.data : data,
    })
  }

  // Return all comparisons
  return NextResponse.json({
    status: 'estimated',
    confidence: 65,
    data: {
      comparisons: Object.values(vsData),
      totalComparisons: Object.keys(vsData).length,
      availableCompetitors: Object.keys(vsData),
    },
  })
}
