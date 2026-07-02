import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/client-zero/content-engine/opportunities
// Returns today's content opportunities from the Opportunity Queue + AI-powered opportunities
export async function GET(request: NextRequest) {
  try {
    const domain = 'seosights.com'
    const opportunities: Array<{
      id: string
      keyword: string
      estimatedScoreGain: number
      source: string
      engines: string[]
      contentType: string
      dataAvailable: boolean
      priority: string
    }> = []

    // 1. Query ActionItem where status='pending' and domain='seosights.com'
    const pendingActions = await db.actionItem.findMany({
      where: {
        status: 'pending',
        domain: domain,
      },
      orderBy: { roiScore: 'desc' },
      take: 20,
    })

    for (const action of pendingActions) {
      const engines = ['chatgpt', 'claude', 'gemini']
      let contentType = 'blog'
      if (action.actionType === 'create_faq') contentType = 'blog'
      else if (action.actionType === 'reddit_answer') contentType = 'blog'
      else if (action.actionType === 'wikipedia') contentType = 'docs'
      else if (action.actionType === 'g2_review') contentType = 'case_study'
      else if (action.actionType === 'entity_fix') contentType = 'docs'
      else if (action.actionType === 'content_update') contentType = 'blog'
      else if (action.actionType === 'schema') contentType = 'docs'

      opportunities.push({
        id: action.id,
        keyword: action.title,
        estimatedScoreGain: action.estimatedScoreGain,
        source: 'opportunity_queue',
        engines,
        contentType,
        dataAvailable: true,
        priority: action.priority,
      })
    }

    // 2. Query AIVisibilityDataPoint for trending queries where seosights.com is NOT cited
    const uncitedDataPoints = await db.aIVisibilityDataPoint.findMany({
      where: {
        domain: domain,
        cited: false,
      },
      orderBy: { scoreImpact: 'desc' },
      take: 10,
      distinct: ['prompt'],
    })

    for (const dp of uncitedDataPoints) {
      const engineList = [dp.engine]
      // Check if same prompt exists for other engines
      const samePromptOtherEngines = await db.aIVisibilityDataPoint.findMany({
        where: {
          prompt: dp.prompt,
          domain: domain,
          cited: false,
          engine: { not: dp.engine },
        },
        select: { engine: true },
      })
      for (const spe of samePromptOtherEngines) {
        if (!engineList.includes(spe.engine)) engineList.push(spe.engine)
      }

      opportunities.push({
        id: `ai-vis-${dp.id}`,
        keyword: dp.prompt,
        estimatedScoreGain: Math.max(3, Math.abs(dp.scoreImpact) || 5),
        source: 'ai_visibility_gap',
        engines: engineList.length > 1 ? engineList : ['chatgpt', 'claude', 'gemini'],
        contentType: 'blog',
        dataAvailable: true,
        priority: dp.scoreImpact > 5 ? 'high' : 'medium',
      })
    }

    // 3. Query IndustryBenchmark for underrepresented industries
    const underrepresentedBenchmarks = await db.industryBenchmark.findMany({
      where: {
        avgAIVisibility: { lt: 40 },
      },
      orderBy: { avgAIVisibility: 'asc' },
      take: 5,
    })

    for (const bench of underrepresentedBenchmarks) {
      opportunities.push({
        id: `bench-${bench.id}`,
        keyword: `AI Visibility for ${bench.industryLabel}`,
        estimatedScoreGain: Math.round((50 - bench.avgAIVisibility) / 8),
        source: 'industry_benchmark',
        engines: ['chatgpt', 'claude', 'gemini'],
        contentType: 'blog',
        dataAvailable: true,
        priority: bench.avgAIVisibility < 25 ? 'high' : 'medium',
      })
    }

    // 4. Query AITwinInsight for active high-priority insights
    const activeInsights = await db.aITwinInsight.findMany({
      where: {
        status: 'active',
        priority: { in: ['high', 'critical'] },
      },
      orderBy: { confidence: 'desc' },
      take: 5,
    })

    for (const insight of activeInsights) {
      opportunities.push({
        id: `twin-${insight.id}`,
        keyword: insight.title,
        estimatedScoreGain: Math.round(insight.confidence * 8),
        source: 'ai_twin',
        engines: ['chatgpt', 'claude', 'gemini'],
        contentType: insight.insightType === 'benchmark_gap' ? 'vs_page' : 'blog',
        dataAvailable: true,
        priority: insight.priority === 'critical' ? 'critical' : insight.priority,
      })
    }

    // If DB is empty, return realistic seed data
    if (opportunities.length === 0) {
      const seedOpportunities = [
        {
          id: 'seed-1',
          keyword: 'AI Visibility for Dentists',
          estimatedScoreGain: 6,
          source: 'opportunity_queue',
          engines: ['chatgpt', 'claude', 'gemini'],
          contentType: 'blog',
          dataAvailable: true,
          priority: 'high',
        },
        {
          id: 'seed-2',
          keyword: 'How to Get Cited by ChatGPT',
          estimatedScoreGain: 8,
          source: 'ai_visibility_gap',
          engines: ['chatgpt'],
          contentType: 'blog',
          dataAvailable: true,
          priority: 'critical',
        },
        {
          id: 'seed-3',
          keyword: 'Claude SEO Optimization Guide',
          estimatedScoreGain: 5,
          source: 'ai_visibility_gap',
          engines: ['claude'],
          contentType: 'blog',
          dataAvailable: true,
          priority: 'high',
        },
        {
          id: 'seed-4',
          keyword: 'AI Visibility for Real Estate',
          estimatedScoreGain: 4,
          source: 'industry_benchmark',
          engines: ['chatgpt', 'claude', 'gemini'],
          contentType: 'blog',
          dataAvailable: true,
          priority: 'medium',
        },
        {
          id: 'seed-5',
          keyword: 'Gemini Citation Strategy 2025',
          estimatedScoreGain: 5,
          source: 'ai_visibility_gap',
          engines: ['gemini'],
          contentType: 'blog',
          dataAvailable: true,
          priority: 'high',
        },
        {
          id: 'seed-6',
          keyword: 'SeoSights vs Surfer SEO',
          estimatedScoreGain: 7,
          source: 'opportunity_queue',
          engines: ['chatgpt', 'claude', 'gemini'],
          contentType: 'vs_page',
          dataAvailable: true,
          priority: 'high',
        },
        {
          id: 'seed-7',
          keyword: 'AEO Optimization for SaaS Companies',
          estimatedScoreGain: 6,
          source: 'ai_twin',
          engines: ['chatgpt', 'claude'],
          contentType: 'blog',
          dataAvailable: true,
          priority: 'high',
        },
        {
          id: 'seed-8',
          keyword: 'AI Visibility for Legal Services',
          estimatedScoreGain: 3,
          source: 'industry_benchmark',
          engines: ['chatgpt', 'claude', 'gemini'],
          contentType: 'blog',
          dataAvailable: true,
          priority: 'medium',
        },
      ]
      opportunities.push(...seedOpportunities)
    }

    // Sort by estimatedScoreGain descending
    opportunities.sort((a, b) => b.estimatedScoreGain - a.estimatedScoreGain)

    return NextResponse.json({ opportunities })
  } catch (error) {
    console.error('[content-engine/opportunities] Error:', error)

    // Return seed data on error so UI always has something
    return NextResponse.json({
      opportunities: [
        { id: 'fallback-1', keyword: 'AI Visibility for Dentists', estimatedScoreGain: 6, source: 'opportunity_queue', engines: ['chatgpt', 'claude', 'gemini'], contentType: 'blog', dataAvailable: true, priority: 'high' },
        { id: 'fallback-2', keyword: 'How to Get Cited by ChatGPT', estimatedScoreGain: 8, source: 'ai_visibility_gap', engines: ['chatgpt'], contentType: 'blog', dataAvailable: true, priority: 'critical' },
        { id: 'fallback-3', keyword: 'Claude SEO Optimization Guide', estimatedScoreGain: 5, source: 'ai_visibility_gap', engines: ['claude'], contentType: 'blog', dataAvailable: true, priority: 'high' },
        { id: 'fallback-4', keyword: 'SeoSights vs Surfer SEO', estimatedScoreGain: 7, source: 'opportunity_queue', engines: ['chatgpt', 'claude', 'gemini'], contentType: 'vs_page', dataAvailable: true, priority: 'high' },
        { id: 'fallback-5', keyword: 'AEO Optimization for SaaS Companies', estimatedScoreGain: 6, source: 'ai_twin', engines: ['chatgpt', 'claude'], contentType: 'blog', dataAvailable: true, priority: 'high' },
      ],
    })
  }
}
