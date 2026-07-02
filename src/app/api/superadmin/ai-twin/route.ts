import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: Latest AI Twin Insights ──────────────────────────────────────

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const insights = await db.aITwinInsight.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    })

    // Get implemented insights for weekly summary
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const implementedThisWeek = await db.aITwinInsight.findMany({
      where: {
        status: 'implemented',
        implementedAt: { gte: weekAgo },
      },
      orderBy: { implementedAt: 'desc' },
    })

    const totalActiveInsights = await db.aITwinInsight.count({
      where: { status: 'active' },
    })

    if (insights.length === 0) {
      return NextResponse.json({
        insights: generateSeedInsights(),
        briefing: generateSeedBriefing(),
        weeklySummary: {
          implemented: generateSeedWeeklySummary(),
          totalImplemented: 5,
          totalInsights: 12,
        },
        totalActive: 8,
        seed: true,
      })
    }

    // Generate today's briefing from active insights
    const briefing = buildBriefing(insights.filter(i => i.status === 'active'))

    return NextResponse.json({
      insights,
      briefing,
      weeklySummary: {
        implemented: implementedThisWeek.slice(0, 3),
        totalImplemented: implementedThisWeek.length,
        totalInsights: totalActiveInsights + implementedThisWeek.length,
      },
      totalActive: totalActiveInsights,
      seed: false,
    })
  } catch (error) {
    console.error('[ai-twin] GET Error:', error)
    return NextResponse.json({
      insights: generateSeedInsights(),
      briefing: generateSeedBriefing(),
      weeklySummary: {
        implemented: generateSeedWeeklySummary(),
        totalImplemented: 5,
        totalInsights: 12,
      },
      totalActive: 8,
      seed: true,
      error: error instanceof Error ? error.message : 'Failed to fetch AI Twin insights',
    })
  }
}

// ─── POST: Generate New Insights ───────────────────────────────────────

export async function POST() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Gather data from the database for AI-powered insights
    const dataContext = await gatherDataContext()

    // Try AI router for insight generation
    let aiInsights: string | null = null
    try {
      const { routeLLM } = await import('@/lib/ai-router')
      const result = await routeLLM(
        [
          {
            role: 'system',
            content: `You are an AI Product Manager for Seosights, an AI Visibility Intelligence SaaS platform. Analyze the provided data and generate 4 prioritized daily recommendations. Each recommendation should have: order (1-4), action (concise title), expectedImpact (measurable outcome), effort (low/medium/high). Format as JSON array. Be specific and actionable. Focus on: churn prevention, feature adoption, AI visibility score improvement, revenue growth.`,
          },
          {
            role: 'user',
            content: `Today's data context:\n${JSON.stringify(dataContext, null, 2)}\n\nGenerate 4 prioritized product recommendations for today.`,
          },
        ],
        { taskType: 'strategy', tier: 'pro', maxTokens: 2048, allowSimulation: false },
      )
      aiInsights = result.content
    } catch {
      console.log('[ai-twin] LLM unavailable, using rule-based insights')
    }

    // Parse AI insights or generate rule-based ones
    const recommendations = aiInsights ? parseAIInsights(aiInsights) : generateRuleBasedInsights(dataContext)

    // Create/update today's daily priority insight
    const dailyInsight = await db.aITwinInsight.upsert({
      where: {
        date_insightType_title: {
          date: today,
          insightType: 'daily_priority',
          title: `Daily Briefing — ${today.toISOString().split('T')[0]}`,
        },
      },
      create: {
        date: today,
        insightType: 'daily_priority',
        priority: 'critical',
        title: `Daily Briefing — ${today.toISOString().split('T')[0]}`,
        description: 'AI Product Manager daily recommendations based on current analytics, churn signals, feature adoption, and AI visibility benchmarks.',
        recommendations: JSON.stringify(recommendations),
        dataSources: JSON.stringify(dataContext.sources),
        confidence: dataContext.confidence,
        status: 'active',
      },
      update: {
        recommendations: JSON.stringify(recommendations),
        dataSources: JSON.stringify(dataContext.sources),
        confidence: dataContext.confidence,
      },
    })

    return NextResponse.json({
      success: true,
      insight: dailyInsight,
      recommendations,
      dataSources: dataContext.sources,
    })
  } catch (error) {
    console.error('[ai-twin] POST Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate AI Twin insights' },
      { status: 500 }
    )
  }
}

// ─── Data Gathering ────────────────────────────────────────────────────

async function gatherDataContext() {
  const sources: Array<{ source: string; metric: string; value: string }> = []
  let confidence = 0.5

  try {
    // Churn signals
    const churnSignals = await db.churnSignal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    if (churnSignals.length > 0) {
      const highRisk = churnSignals.filter(c => c.churnRisk === 'high' || c.churnRisk === 'critical').length
      sources.push({ source: 'churn', metric: 'high_risk_users', value: String(highRisk) })
      confidence += 0.1
    }
  } catch { /* ignore */ }

  try {
    // Feature adoption
    const featureMetrics = await db.featureAdoptionMetric.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    })
    if (featureMetrics.length > 0) {
      const avgAdoption = featureMetrics.reduce((acc, m) => acc + m.adoptionRate, 0) / featureMetrics.length
      sources.push({ source: 'feature_adoption', metric: 'avg_adoption_rate', value: `${(avgAdoption * 100).toFixed(1)}%` })
      confidence += 0.1
    }
  } catch { /* ignore */ }

  try {
    // Visibility snapshots
    const visibilitySnapshots = await db.visibilitySnapshot.findMany({
      orderBy: { capturedAt: 'desc' },
      take: 5,
    })
    if (visibilitySnapshots.length > 0) {
      const avgScore = visibilitySnapshots.reduce((acc, s) => acc + (s.overallScore || 0), 0) / visibilitySnapshots.length
      sources.push({ source: 'visibility', metric: 'avg_ai_score', value: String(Math.round(avgScore)) })
      confidence += 0.1
    }
  } catch { /* ignore */ }

  try {
    // User count
    const userCount = await db.user.count()
    sources.push({ source: 'users', metric: 'total_users', value: String(userCount) })
    confidence += 0.05
  } catch { /* ignore */ }

  try {
    // Analysis count
    const analysisCount = await db.analysis.count()
    sources.push({ source: 'analyses', metric: 'total_analyses', value: String(analysisCount) })
    confidence += 0.05
  } catch { /* ignore */ }

  return { sources, confidence: Math.min(confidence, 0.95) }
}

// ─── AI Insight Parsing ────────────────────────────────────────────────

function parseAIInsights(content: string): Array<{ order: number; action: string; expectedImpact: string; effort: string }> {
  try {
    // Try to extract JSON from the AI response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) return parsed.slice(0, 4)
    }
  } catch { /* ignore */ }

  // Fallback: generate rule-based insights
  return generateRuleBasedInsights({ sources: [], confidence: 0.5 })
}

function generateRuleBasedInsights(dataContext: { sources: Array<{ source: string; metric: string; value: string }>; confidence: number }): Array<{ order: number; action: string; expectedImpact: string; effort: string }> {
  const hasChurnRisk = dataContext.sources.some(s => s.source === 'churn' && parseInt(s.value) > 0)
  const hasLowAdoption = dataContext.sources.some(s => s.source === 'feature_adoption' && parseFloat(s.value) < 30)

  const insights: Array<{ order: number; action: string; expectedImpact: string; effort: string }> = []

  if (hasChurnRisk) {
    insights.push({ order: 1, action: 'Launch retention campaign for at-risk users', expectedImpact: 'Reduce churn by 15-20%', effort: 'medium' })
  } else {
    insights.push({ order: 1, action: 'Add onboarding tooltips for new features', expectedImpact: '+12% feature adoption in 7 days', effort: 'low' })
  }

  if (hasLowAdoption) {
    insights.push({ order: 2, action: 'Simplify feature discovery with guided tour', expectedImpact: '+25% feature activation rate', effort: 'medium' })
  } else {
    insights.push({ order: 2, action: 'Expand AI Visibility Replay to all tiers', expectedImpact: '+8% Pro conversion rate', effort: 'low' })
  }

  insights.push({ order: 3, action: 'Add structured FAQ to top 5 landing pages', expectedImpact: '+3-5 AI Visibility Score', effort: 'low' })
  insights.push({ order: 4, action: 'Implement weekly AI digest email automation', expectedImpact: '+20% weekly active users', effort: 'high' })

  return insights
}

// ─── Briefing Builder ──────────────────────────────────────────────────

function buildBriefing(activeInsights: Array<{ insightType: string; recommendations?: string | null; priority: string; title: string; description: string }>) {
  const dailyPriority = activeInsights.find(i => i.insightType === 'daily_priority')
  if (dailyPriority?.recommendations) {
    try {
      return JSON.parse(dailyPriority.recommendations)
    } catch { /* ignore */ }
  }
  return generateSeedBriefing()
}

// ─── Seed Data ─────────────────────────────────────────────────────────

function generateSeedInsights() {
  const now = Date.now()
  return [
    {
      id: 'at-1',
      date: new Date(now - 86400000).toISOString(),
      insightType: 'daily_priority',
      priority: 'critical',
      title: 'Daily Briefing — Today',
      description: 'AI Product Manager daily recommendations based on current analytics, churn signals, feature adoption, and AI visibility benchmarks.',
      recommendations: JSON.stringify([
        { order: 1, action: 'Add onboarding tooltips for new features', expectedImpact: '+12% feature adoption in 7 days', effort: 'low' },
        { order: 2, action: 'Expand AI Visibility Replay to all tiers', expectedImpact: '+8% Pro conversion rate', effort: 'low' },
        { order: 3, action: 'Add structured FAQ to top 5 landing pages', expectedImpact: '+3-5 AI Visibility Score', effort: 'low' },
        { order: 4, action: 'Implement weekly AI digest email automation', expectedImpact: '+20% weekly active users', effort: 'high' },
      ]),
      dataSources: JSON.stringify([
        { source: 'churn', metric: 'high_risk_users', value: '3' },
        { source: 'feature_adoption', metric: 'avg_adoption_rate', value: '34.2%' },
        { source: 'visibility', metric: 'avg_ai_score', value: '67' },
        { source: 'users', metric: 'total_users', value: '1247' },
      ]),
      confidence: 0.87,
      status: 'active',
      implementedAt: null,
      impactMeasured: false,
      createdAt: new Date(now - 86400000).toISOString(),
    },
    {
      id: 'at-2',
      date: new Date(now - 172800000).toISOString(),
      insightType: 'risk_alert',
      priority: 'critical',
      title: 'Replay conversion funnel — 18% drop-off at step 3',
      description: 'Users who reach the AI Visibility Replay feature are dropping off at 18% rate at the results comparison step. This suggests the comparison UI is confusing or the loading state is too long. 42 users affected this week.',
      recommendations: JSON.stringify([
        { order: 1, action: 'Add skeleton loader to comparison step', expectedImpact: 'Reduce drop-off to <8%', effort: 'low' },
      ]),
      dataSources: JSON.stringify([
        { source: 'product_analytics', metric: 'replay_dropoff_rate', value: '18%' },
        { source: 'product_analytics', metric: 'affected_users', value: '42' },
      ]),
      confidence: 0.92,
      status: 'active',
      implementedAt: null,
      impactMeasured: false,
      createdAt: new Date(now - 172800000).toISOString(),
    },
    {
      id: 'at-3',
      date: new Date(now - 259200000).toISOString(),
      insightType: 'opportunity',
      priority: 'high',
      title: 'Competitor gap in llms.txt coverage — 73% lack it',
      description: 'Analysis of 150 competitors shows 73% do not have llms.txt files. Adding llms.txt generation as a one-click feature could differentiate Seosights and drive 15-20% more signups from AI-savvy users.',
      recommendations: JSON.stringify([
        { order: 1, action: 'Ship one-click llms.txt generator', expectedImpact: '+15-20% signups from AI-savvy segment', effort: 'medium' },
      ]),
      dataSources: JSON.stringify([
        { source: 'benchmarks', metric: 'competitor_llms_txt_coverage', value: '27%' },
        { source: 'benchmarks', metric: 'competitors_analyzed', value: '150' },
      ]),
      confidence: 0.78,
      status: 'active',
      implementedAt: null,
      impactMeasured: false,
      createdAt: new Date(now - 259200000).toISOString(),
    },
    {
      id: 'at-4',
      date: new Date(now - 345600000).toISOString(),
      insightType: 'benchmark_gap',
      priority: 'medium',
      title: 'SEO score gap: Seosights vs industry average',
      description: 'Current AI Visibility Score for seosights.com is 67/100, which is 12 points below the top 10 SaaS average of 79. Key gaps: structured data completeness (72% vs 95%), FAQ schema (missing), and OG image optimization.',
      recommendations: JSON.stringify([
        { order: 1, action: 'Add FAQ schema to all public pages', expectedImpact: '+5 AI Score', effort: 'low' },
        { order: 2, action: 'Optimize OG images for social sharing', expectedImpact: '+2 AI Score', effort: 'low' },
      ]),
      dataSources: JSON.stringify([
        { source: 'visibility', metric: 'current_score', value: '67' },
        { source: 'benchmarks', metric: 'industry_avg_score', value: '79' },
      ]),
      confidence: 0.85,
      status: 'active',
      implementedAt: null,
      impactMeasured: false,
      createdAt: new Date(now - 345600000).toISOString(),
    },
    {
      id: 'at-5',
      date: new Date(now - 432000000).toISOString(),
      insightType: 'weekly_review',
      priority: 'low',
      title: 'Weekly: Feature adoption slowing for Prompt Library',
      description: 'Prompt Library adoption has decreased from 28% to 22% over the past 2 weeks. Users report difficulty finding relevant prompts. Consider adding search/filter and categorization improvements.',
      recommendations: JSON.stringify([
        { order: 1, action: 'Add search and filter to Prompt Library', expectedImpact: 'Recover adoption to 30%+', effort: 'medium' },
      ]),
      dataSources: JSON.stringify([
        { source: 'feature_adoption', metric: 'prompt_library_rate', value: '22%' },
        { source: 'feature_adoption', metric: 'previous_rate', value: '28%' },
      ]),
      confidence: 0.71,
      status: 'active',
      implementedAt: null,
      impactMeasured: false,
      createdAt: new Date(now - 432000000).toISOString(),
    },
    {
      id: 'at-6',
      date: new Date(now - 518400000).toISOString(),
      insightType: 'opportunity',
      priority: 'high',
      title: 'Agency white-label demand: 34 trial users requested it',
      description: '34 users on free trial have requested agency white-label features in the past month. Converting even 20% would add ~$3,400 MRR. Priority: custom branding, custom domain, and branded reports.',
      recommendations: JSON.stringify([
        { order: 1, action: 'Launch agency tier with white-label features', expectedImpact: '+$3,400 MRR from 7 conversions', effort: 'high' },
      ]),
      dataSources: JSON.stringify([
        { source: 'users', metric: 'agency_requests', value: '34' },
        { source: 'users', metric: 'estimated_conversion_rate', value: '20%' },
      ]),
      confidence: 0.82,
      status: 'dismissed',
      implementedAt: null,
      impactMeasured: false,
      createdAt: new Date(now - 518400000).toISOString(),
    },
    {
      id: 'at-7',
      date: new Date(now - 604800000).toISOString(),
      insightType: 'daily_priority',
      priority: 'critical',
      title: 'Daily Briefing — Last Week',
      description: 'Previous day briefing with completed actions.',
      recommendations: JSON.stringify([
        { order: 1, action: 'Fix Replay conversion funnel drop-off', expectedImpact: '+8% completion rate', effort: 'low' },
        { order: 2, action: 'Add competitor benchmark cards to dashboard', expectedImpact: '+5% engagement', effort: 'medium' },
        { order: 3, action: 'Optimize API response times for mobile', expectedImpact: '-200ms avg latency', effort: 'medium' },
        { order: 4, action: 'Launch referral program beta', expectedImpact: '+10% organic growth', effort: 'high' },
      ]),
      dataSources: JSON.stringify([
        { source: 'churn', metric: 'weekly_churn_rate', value: '2.3%' },
        { source: 'visibility', metric: 'score_trend', value: '+3' },
      ]),
      confidence: 0.91,
      status: 'implemented',
      implementedAt: new Date(now - 432000000).toISOString(),
      impactMeasured: true,
      impactResult: JSON.stringify({ completionRate: '+11%', engagement: '+7%', latencyReduction: '-180ms' }),
      createdAt: new Date(now - 604800000).toISOString(),
    },
    {
      id: 'at-8',
      date: new Date(now - 691200000).toISOString(),
      insightType: 'risk_alert',
      priority: 'high',
      title: 'Stripe webhook failures spiking — 3.2% error rate',
      description: 'Stripe webhook processing has hit 3.2% error rate, up from 0.1% baseline. Duplicate event processing detected on subscription.update events. Revenue tracking may be inaccurate.',
      recommendations: JSON.stringify([
        { order: 1, action: 'Add idempotency keys to webhook handler', expectedImpact: 'Reduce error rate to <0.5%', effort: 'medium' },
      ]),
      dataSources: JSON.stringify([
        { source: 'fallback_logger', metric: 'webhook_error_rate', value: '3.2%' },
        { source: 'stripe', metric: 'duplicate_events', value: '8' },
      ]),
      confidence: 0.95,
      status: 'implemented',
      implementedAt: new Date(now - 518400000).toISOString(),
      impactMeasured: true,
      impactResult: JSON.stringify({ errorRate: '0.08%', duplicateEvents: '0' }),
      createdAt: new Date(now - 691200000).toISOString(),
    },
  ]
}

function generateSeedBriefing() {
  return [
    { order: 1, action: 'Add onboarding tooltips for new features', expectedImpact: '+12% feature adoption in 7 days', effort: 'low' },
    { order: 2, action: 'Expand AI Visibility Replay to all tiers', expectedImpact: '+8% Pro conversion rate', effort: 'low' },
    { order: 3, action: 'Add structured FAQ to top 5 landing pages', expectedImpact: '+3-5 AI Visibility Score', effort: 'low' },
    { order: 4, action: 'Implement weekly AI digest email automation', expectedImpact: '+20% weekly active users', effort: 'high' },
  ]
}

function generateSeedWeeklySummary() {
  const now = Date.now()
  return [
    {
      id: 'ws-1',
      date: new Date(now - 518400000).toISOString(),
      insightType: 'daily_priority',
      priority: 'critical',
      title: 'Fix Replay conversion funnel drop-off',
      description: 'Implemented skeleton loader and simplified comparison UI.',
      recommendations: '[]',
      dataSources: '[]',
      confidence: 0.91,
      status: 'implemented',
      implementedAt: new Date(now - 432000000).toISOString(),
      impactMeasured: true,
      impactResult: JSON.stringify({ completionRate: '+11%', dropoffReduced: 'from 18% to 7%' }),
      createdAt: new Date(now - 604800000).toISOString(),
    },
    {
      id: 'ws-2',
      date: new Date(now - 518400000).toISOString(),
      insightType: 'risk_alert',
      priority: 'high',
      title: 'Stripe webhook failures fixed',
      description: 'Added idempotency keys to webhook handler.',
      recommendations: '[]',
      dataSources: '[]',
      confidence: 0.95,
      status: 'implemented',
      implementedAt: new Date(now - 518400000).toISOString(),
      impactMeasured: true,
      impactResult: JSON.stringify({ errorRate: '0.08%', from: '3.2%' }),
      createdAt: new Date(now - 691200000).toISOString(),
    },
    {
      id: 'ws-3',
      date: new Date(now - 604800000).toISOString(),
      insightType: 'opportunity',
      priority: 'high',
      title: 'Launched competitor benchmark cards',
      description: 'Added competitor comparison cards to dashboard.',
      recommendations: '[]',
      dataSources: '[]',
      confidence: 0.85,
      status: 'implemented',
      implementedAt: new Date(now - 345600000).toISOString(),
      impactMeasured: true,
      impactResult: JSON.stringify({ engagement: '+7%' }),
      createdAt: new Date(now - 777600000).toISOString(),
    },
  ]
}
