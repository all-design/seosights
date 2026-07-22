/**
 * Cron API — Observatory Monthly Pipeline
 *
 * GET /api/cron/observatory-monthly
 *
 * Schedule: 1st of every month at 06:00 UTC
 * Purpose: Monthly deep analysis, AI Search trends, engine comparison, trend analysis,
 *          industry ranking updates, and comprehensive PDF-ready report.
 *
 * Pipeline steps:
 * 1. Generate the monthly "AI Visibility Report"
 * 2. Compare all AI model behavior over the month
 * 3. Create trend analysis (comparing to previous month)
 * 4. Update all industry rankings
 * 5. Generate a comprehensive PDF-ready report
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'
import { parseLLMJson } from '@/lib/llm-utils'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // No secret → dev/sandbox mode

  const authHeader = request.headers.get('authorization') || ''
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch && bearerMatch[1] === secret) return true

  const xHeader = request.headers.get('x-cron-secret')
  if (xHeader && xHeader === secret) return true

  return false
}

/**
 * Generate a URL-friendly slug from a title.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * GET handler — runs the monthly observatory pipeline.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }

  const pipelineStart = Date.now()
  const summary: {
    monthlyReport: Record<string, unknown> | null
    modelComparison: Record<string, unknown> | null
    trendAnalysis: Record<string, unknown> | null
    industryRankings: Record<string, unknown> | null
    comprehensiveReport: Record<string, unknown> | null
    errors: string[]
    totalDurationMs: number
  } = {
    monthlyReport: null,
    modelComparison: null,
    trendAnalysis: null,
    industryRankings: null,
    comprehensiveReport: null,
    errors: [],
    totalDurationMs: 0,
  }

  try {
    const now = new Date()
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const twoMonthsAgo = new Date(now)
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Monthly "AI Visibility Report"
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-monthly] Step 1: Generating monthly AI Visibility Report...')

    try {
      // Gather monthly stats
      const [
        monthlyCrawls,
        monthlyResponses,
        monthlyChanges,
        monthlySignals,
        monthlyReports,
        monthlyPublished,
      ] = await Promise.all([
        db.observatoryCrawl.count({ where: { createdAt: { gte: oneMonthAgo } } }),
        db.observatoryResponse.count({ where: { createdAt: { gte: oneMonthAgo } } }),
        db.observatoryChange.count({ where: { createdAt: { gte: oneMonthAgo } } }),
        db.observatoryChange.count({ where: { isSignal: true, createdAt: { gte: oneMonthAgo } } }),
        db.observatoryReport.count({ where: { createdAt: { gte: oneMonthAgo } } }),
        db.observatoryReport.count({ where: { status: 'published', createdAt: { gte: oneMonthAgo } } }),
      ])

      // Get top 10 signals this month
      const topMonthlySignals = await db.observatoryChange.findMany({
        where: { isSignal: true, createdAt: { gte: oneMonthAgo } },
        orderBy: { significanceScore: 'desc' },
        take: 10,
      })

      // Signals by model
      const signalsByModel = await db.observatoryChange.groupBy({
        by: ['aiModel'],
        where: { isSignal: true, createdAt: { gte: oneMonthAgo } },
        _count: { id: true },
        _avg: { significanceScore: true },
      })

      // Signals by category
      const signalsByCategory = await db.observatoryChange.groupBy({
        by: ['category'],
        where: { isSignal: true, createdAt: { gte: oneMonthAgo } },
        _count: { id: true },
      })

      const reportPrompt = `Generate the monthly "AI Visibility Report" — a comprehensive analysis of how AI models are behaving, what's changing in AI search, and what it means for businesses.

MONTHLY STATS (past 30 days):
- Crawls performed: ${monthlyCrawls}
- AI model responses collected: ${monthlyResponses}
- Changes detected: ${monthlyChanges}
- Signals identified: ${monthlySignals}
- Reports generated: ${monthlyReports}
- Reports published: ${monthlyPublished}

TOP 10 SIGNALS THIS MONTH:
${topMonthlySignals.map((s, i) => `#${i + 1}: ${s.aiModel} — ${s.changeType} in ${s.category} (score: ${s.significanceScore.toFixed(2)})\n  Before: ${s.beforeSummary}\n  After: ${s.afterSummary}`).join('\n\n') || 'No signals this month'}

SIGNALS BY MODEL:
${signalsByModel.map((s) => `- ${s.aiModel}: ${s._count.id} signals (avg significance: ${s._avg.significanceScore?.toFixed(2) || '0.00'})`).join('\n') || 'No model data'}

SIGNALS BY CATEGORY:
${signalsByCategory.map((s) => `- ${s.category}: ${s._count.id} signals`).join('\n') || 'No category data'}

Return ONLY valid JSON:
{
  "title": "AI Visibility Report — [Month Year]",
  "summary": "Executive summary of the month's AI visibility landscape",
  "keyFindings": ["finding 1", "finding 2", "finding 3", "finding 4", "finding 5"],
  "sections": [
    { "heading": "Section Title", "content": "Section content in markdown" }
  ],
  "conclusion": "Strategic takeaways for businesses",
  "recommendations": ["strategic recommendation 1", "recommendation 2"],
  "topModels": ["most active/changing models"],
  "categories": ["most affected categories"],
  "monthHighlights": ["highlight 1", "highlight 2"]
}

This is the flagship monthly report — make it thorough, data-driven, and at least 1200 words.`

      const result = await routeLLM([
          {
            role: 'system',
            content:
              'You are a senior research analyst who authors the flagship monthly AI Visibility Report. This is the most important publication of the month. You must return ONLY valid JSON with no extra commentary.',
          },
          { role: 'user', content: reportPrompt },
        ],
        { taskType: 'long_report' }
      )

      const raw = result.content || ''
      const parsed = parseLLMJson(raw)

      const markdownSections = (parsed.sections || [])
        .map((s: { heading: string; content: string }) => `## ${s.heading}\n\n${s.content}`)
        .join('\n\n')

      const contentMarkdown = `# ${parsed.title}\n\n${parsed.summary}\n\n${markdownSections}\n\n## Conclusion\n\n${parsed.conclusion || ''}`
      const wordCount = contentMarkdown.split(/\s+/).length
      const readingTimeMin = Math.max(1, Math.ceil(wordCount / 250))

      const baseSlug = slugify(String(parsed.title || 'monthly-ai-visibility-report'))
      const slug = `${baseSlug}-${Date.now().toString(36)}`

      const report = await db.observatoryReport.create({
        data: {
          slug,
          title: String(parsed.title || 'Monthly AI Visibility Report').slice(0, 200),
          type: 'monthly_report',
          status: 'proposed',
          editorialScore: 0,
          aiModels: JSON.stringify(parsed.topModels || []),
          categories: JSON.stringify(parsed.categories || []),
          contentJson: JSON.stringify(parsed),
          contentMarkdown,
          summary: String(parsed.summary || '').slice(0, 1000),
          keyFindings: JSON.stringify(parsed.keyFindings || []),
          relatedChanges: JSON.stringify(topMonthlySignals.map((s) => s.id)),
          wordCount,
          readingTimeMin,
        },
      })

      summary.monthlyReport = {
        reportId: report.id,
        slug: report.slug,
        title: report.title,
        wordCount,
        readingTimeMin,
        stats: {
          monthlyCrawls,
          monthlyResponses,
          monthlyChanges,
          monthlySignals,
          monthlyReports,
          monthlyPublished,
        },
      }

      console.log(
        `[cron/observatory-monthly] Step 1 complete: Monthly report "${report.title}" (${wordCount} words)`
      )
    } catch (step1Error) {
      const msg = step1Error instanceof Error ? step1Error.message : 'Unknown error'
      summary.errors.push(`Monthly report step failed: ${msg}`)
      summary.monthlyReport = { failed: true, error: msg }
      console.error('[cron/observatory-monthly] Step 1 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: AI Model Behavior Comparison
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-monthly] Step 2: Comparing AI model behavior...')

    try {
      // Get response data per model for this month
      const responsesByModel = await db.observatoryResponse.groupBy({
        by: ['aiModel'],
        where: { createdAt: { gte: oneMonthAgo } },
        _count: { id: true },
        _avg: { responseTimeMs: true },
      })

      // Get change/signals data per model
      const modelChangeData = await db.observatoryChange.groupBy({
        by: ['aiModel'],
        where: { createdAt: { gte: oneMonthAgo } },
        _count: { id: true },
        _avg: { significanceScore: true },
      })

      const modelSignalData = await db.observatoryChange.groupBy({
        by: ['aiModel'],
        where: { isSignal: true, createdAt: { gte: oneMonthAgo } },
        _count: { id: true },
      })

      // Get citation data per model
      const modelCitationData = await db.observatoryResponse.findMany({
        where: {
          createdAt: { gte: oneMonthAgo },
          citationsJson: { not: null },
        },
        select: {
          aiModel: true,
          citationsJson: true,
        },
      })

      // Count citations per model
      const citationsPerModel: Record<string, number> = {}
      for (const resp of modelCitationData) {
        try {
          const citations = JSON.parse(resp.citationsJson || '[]') as unknown[]
          citationsPerModel[resp.aiModel] = (citationsPerModel[resp.aiModel] || 0) + citations.length
        } catch {
          // Skip malformed JSON
        }
      }

      const modelComparisonData = responsesByModel.map((r) => {
        const changeInfo = modelChangeData.find((c) => c.aiModel === r.aiModel)
        const signalInfo = modelSignalData.find((s) => s.aiModel === r.aiModel)
        return {
          model: r.aiModel,
          totalResponses: r._count.id,
          avgResponseTimeMs: r._avg.responseTimeMs?.toFixed(0) || 'N/A',
          totalChanges: changeInfo?._count.id || 0,
          avgSignificance: changeInfo?._avg.significanceScore?.toFixed(2) || '0.00',
          totalSignals: signalInfo?._count.id || 0,
          totalCitations: citationsPerModel[r.aiModel] || 0,
        }
      })

      const comparisonPrompt = `Analyze and compare the behavior of major AI models over the past month. Produce a detailed model comparison report.

MODEL COMPARISON DATA:
${modelComparisonData.map((m) => `- ${m.model}: ${m.totalResponses} responses, ${m.totalChanges} changes, ${m.totalSignals} signals, ${m.totalCitations} citations, avg significance: ${m.avgSignificance}, avg response time: ${m.avgResponseTimeMs}ms`).join('\n')}

Return ONLY valid JSON:
{
  "title": "AI Model Behavior Comparison — [Month Year]",
  "summary": "Executive summary of how AI models compare",
  "modelRankings": [
    { "rank": 1, "model": "model name", "stability": "high/medium/low", "changeFrequency": "description", "citationTendency": "description", "overallAssessment": "brief assessment" }
  ],
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "sections": [
    { "heading": "Section Title", "content": "Section content in markdown" }
  ],
  "conclusion": "What this comparison means",
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Make it analytical and at least 800 words.`

      const result = await routeLLM([
          {
            role: 'system',
            content:
              'You are an expert AI model behavior analyst who produces detailed comparison reports. You must return ONLY valid JSON with no extra commentary.',
          },
          { role: 'user', content: comparisonPrompt },
        ],
        { taskType: 'reasoning' }
      )

      const raw = result.content || ''
      const parsed = parseLLMJson(raw)

      const markdownSections = (parsed.sections || [])
        .map((s: { heading: string; content: string }) => `## ${s.heading}\n\n${s.content}`)
        .join('\n\n')

      const contentMarkdown = `# ${parsed.title}\n\n${parsed.summary}\n\n${markdownSections}\n\n## Conclusion\n\n${parsed.conclusion || ''}`
      const wordCount = contentMarkdown.split(/\s+/).length
      const readingTimeMin = Math.max(1, Math.ceil(wordCount / 250))

      const baseSlug = slugify(String(parsed.title || 'ai-model-comparison'))
      const slug = `${baseSlug}-${Date.now().toString(36)}`

      const modelsInReport = (parsed.modelRankings as Array<{ model: string }> || []).map((m) => m.model)

      const report = await db.observatoryReport.create({
        data: {
          slug,
          title: String(parsed.title || 'AI Model Behavior Comparison').slice(0, 200),
          type: 'research',
          status: 'proposed',
          editorialScore: 0,
          aiModels: JSON.stringify(modelsInReport),
          categories: JSON.stringify(['model_comparison', 'monthly']),
          contentJson: JSON.stringify(parsed),
          contentMarkdown,
          summary: String(parsed.summary || '').slice(0, 1000),
          keyFindings: JSON.stringify(parsed.keyInsights || []),
          wordCount,
          readingTimeMin,
        },
      })

      summary.modelComparison = {
        reportId: report.id,
        slug: report.slug,
        title: report.title,
        wordCount,
        modelsCompared: modelComparisonData.length,
      }

      console.log(
        `[cron/observatory-monthly] Step 2 complete: Model comparison report "${report.title}" (${wordCount} words)`
      )
    } catch (step2Error) {
      const msg = step2Error instanceof Error ? step2Error.message : 'Unknown error'
      summary.errors.push(`Model comparison step failed: ${msg}`)
      summary.modelComparison = { failed: true, error: msg }
      console.error('[cron/observatory-monthly] Step 2 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Trend Analysis (compare current vs. previous month)
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-monthly] Step 3: Creating trend analysis...')

    try {
      // Current month stats
      const currentMonthSignals = await db.observatoryChange.count({
        where: { isSignal: true, createdAt: { gte: oneMonthAgo } },
      })
      const currentMonthChanges = await db.observatoryChange.count({
        where: { createdAt: { gte: oneMonthAgo } },
      })
      const currentMonthCrawls = await db.observatoryCrawl.count({
        where: { createdAt: { gte: oneMonthAgo } },
      })

      // Previous month stats
      const previousMonthSignals = await db.observatoryChange.count({
        where: {
          isSignal: true,
          createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
        },
      })
      const previousMonthChanges = await db.observatoryChange.count({
        where: { createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo } },
      })
      const previousMonthCrawls = await db.observatoryCrawl.count({
        where: { createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo } },
      })

      // Significance trends by model (current month)
      const currentModelTrends = await db.observatoryChange.groupBy({
        by: ['aiModel'],
        where: { isSignal: true, createdAt: { gte: oneMonthAgo } },
        _count: { id: true },
        _avg: { significanceScore: true },
      })

      // Significance trends by model (previous month)
      const previousModelTrends = await db.observatoryChange.groupBy({
        by: ['aiModel'],
        where: { isSignal: true, createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo } },
        _count: { id: true },
        _avg: { significanceScore: true },
      })

      const trendPrompt = `Analyze month-over-month trends in AI visibility and model behavior.

CURRENT MONTH STATS:
- Crawls: ${currentMonthCrawls}
- Changes detected: ${currentMonthChanges}
- Signals identified: ${currentMonthSignals}

PREVIOUS MONTH STATS:
- Crawls: ${previousMonthCrawls}
- Changes detected: ${previousMonthChanges}
- Signals identified: ${previousMonthSignals}

CURRENT MONTH BY MODEL:
${currentModelTrends.map((m) => `- ${m.aiModel}: ${m._count.id} signals (avg significance: ${m._avg.significanceScore?.toFixed(2) || '0.00'})`).join('\n') || 'No data'}

PREVIOUS MONTH BY MODEL:
${previousModelTrends.map((m) => `- ${m.aiModel}: ${m._count.id} signals (avg significance: ${m._avg.significanceScore?.toFixed(2) || '0.00'})`).join('\n') || 'No data'}

Return ONLY valid JSON:
{
  "title": "AI Visibility Trend Analysis — [Month] vs [Previous Month]",
  "summary": "Executive summary of trends",
  "trendHighlights": ["trend 1", "trend 2", "trend 3"],
  "modelTrends": [
    { "model": "model name", "currentSignals": 10, "previousSignals": 8, "trend": "increasing/stable/decreasing", "analysis": "brief analysis" }
  ],
  "sections": [
    { "heading": "Section Title", "content": "Section content in markdown" }
  ],
  "conclusion": "What these trends mean",
  "forecast": "Brief forecast for next month"
}

Make it analytical, trend-focused, and at least 800 words.`

      const result = await routeLLM([
          {
            role: 'system',
            content:
              'You are a trend analyst who specializes in AI visibility and search behavior trends. You must return ONLY valid JSON with no extra commentary.',
          },
          { role: 'user', content: trendPrompt },
        ],
        { taskType: 'reasoning' }
      )

      const raw = result.content || ''
      const parsed = parseLLMJson(raw)

      const markdownSections = (parsed.sections || [])
        .map((s: { heading: string; content: string }) => `## ${s.heading}\n\n${s.content}`)
        .join('\n\n')

      const forecastSection = parsed.forecast ? `\n\n## Forecast\n\n${parsed.forecast}` : ''
      const contentMarkdown = `# ${parsed.title}\n\n${parsed.summary}\n\n${markdownSections}\n\n## Conclusion\n\n${parsed.conclusion || ''}${forecastSection}`
      const wordCount = contentMarkdown.split(/\s+/).length
      const readingTimeMin = Math.max(1, Math.ceil(wordCount / 250))

      const baseSlug = slugify(String(parsed.title || 'ai-visibility-trend-analysis'))
      const slug = `${baseSlug}-${Date.now().toString(36)}`

      const report = await db.observatoryReport.create({
        data: {
          slug,
          title: String(parsed.title || 'AI Visibility Trend Analysis').slice(0, 200),
          type: 'research',
          status: 'proposed',
          editorialScore: 0,
          aiModels: JSON.stringify(
            (parsed.modelTrends as Array<{ model: string }> || []).map((m) => m.model)
          ),
          categories: JSON.stringify(['trend_analysis', 'monthly']),
          contentJson: JSON.stringify(parsed),
          contentMarkdown,
          summary: String(parsed.summary || '').slice(0, 1000),
          keyFindings: JSON.stringify(parsed.trendHighlights || []),
          wordCount,
          readingTimeMin,
        },
      })

      summary.trendAnalysis = {
        reportId: report.id,
        slug: report.slug,
        title: report.title,
        wordCount,
        currentMonth: { crawls: currentMonthCrawls, changes: currentMonthChanges, signals: currentMonthSignals },
        previousMonth: { crawls: previousMonthCrawls, changes: previousMonthChanges, signals: previousMonthSignals },
        signalDelta: currentMonthSignals - previousMonthSignals,
      }

      console.log(
        `[cron/observatory-monthly] Step 3 complete: Trend analysis "${report.title}" (${wordCount} words)`
      )
    } catch (step3Error) {
      const msg = step3Error instanceof Error ? step3Error.message : 'Unknown error'
      summary.errors.push(`Trend analysis step failed: ${msg}`)
      summary.trendAnalysis = { failed: true, error: msg }
      console.error('[cron/observatory-monthly] Step 3 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Update all industry rankings
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-monthly] Step 4: Updating industry rankings...')

    try {
      const industries = await db.observatoryIndustry.findMany()
      let rankingsUpdated = 0
      const rankingErrors: string[] = []

      // Get monthly signals by category
      const monthlySignalsByCategory = await db.observatoryChange.groupBy({
        by: ['category'],
        where: { isSignal: true, createdAt: { gte: oneMonthAgo } },
        _count: { id: true },
        _avg: { significanceScore: true },
      })

      // Get responses by model for ranking purposes
      const monthlyResponsesByModel = await db.observatoryResponse.groupBy({
        by: ['aiModel'],
        where: { createdAt: { gte: oneMonthAgo } },
        _count: { id: true },
      })

      const modelRankings = monthlyResponsesByModel
        .map((r) => ({ model: r.aiModel, responseCount: r._count.id }))
        .sort((a, b) => b.responseCount - a.responseCount)

      for (const industry of industries) {
        try {
          // Calculate visibility score from monthly signals
          const relevantSignals = monthlySignalsByCategory.filter(
            (s) =>
              s.category === 'industry_query' ||
              s.category === 'recommendation_query'
          )

          const visibilityScore =
            relevantSignals.length > 0
              ? relevantSignals.reduce((sum, s) => sum + (s._avg.significanceScore || 0), 0) /
                relevantSignals.length
              : industry.aiVisibilityAvg

          // Build comprehensive rankings
          const rankings = modelRankings.map((m, idx) => ({
            rank: idx + 1,
            model: m.model,
            responseCount: m.responseCount,
            industryRelevance: relevantSignals.some((s) => s.category === 'industry_query')
              ? 'high'
              : 'moderate',
          }))

          // Build benchmarks
          const benchmarks = {
            totalSignalsThisMonth: monthlySignalsByCategory.reduce((sum, s) => sum + s._count.id, 0),
            visibilityScore: visibilityScore.toFixed(2),
            topCategories: monthlySignalsByCategory
              .sort((a, b) => b._count.id - a._count.id)
              .slice(0, 5)
              .map((s) => ({ category: s.category, count: s._count.id })),
            modelDistribution: modelRankings.slice(0, 5),
          }

          await db.observatoryIndustry.update({
            where: { id: industry.id },
            data: {
              aiVisibilityAvg: visibilityScore,
              topModelsJson: JSON.stringify(modelRankings.slice(0, 5)),
              rankingsJson: JSON.stringify(rankings),
              benchmarksJson: JSON.stringify(benchmarks),
              lastUpdated: new Date(),
            },
          })

          rankingsUpdated++
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error'
          rankingErrors.push(`${industry.name}: ${errMsg}`)
        }
      }

      summary.industryRankings = {
        industriesUpdated: rankingsUpdated,
        totalIndustries: industries.length,
        errors: rankingErrors.length,
      }

      if (rankingErrors.length > 0) {
        summary.errors.push(`Industry ranking errors: ${rankingErrors.join('; ')}`)
      }

      console.log(
        `[cron/observatory-monthly] Step 4 complete: ${rankingsUpdated}/${industries.length} rankings updated`
      )
    } catch (step4Error) {
      const msg = step4Error instanceof Error ? step4Error.message : 'Unknown error'
      summary.errors.push(`Industry rankings step failed: ${msg}`)
      summary.industryRankings = { failed: true, error: msg }
      console.error('[cron/observatory-monthly] Step 4 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Generate comprehensive PDF-ready report
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-monthly] Step 5: Generating comprehensive PDF-ready report...')

    try {
      // Get all monthly published reports for cross-referencing
      const monthlyPublishedReports = await db.observatoryReport.findMany({
        where: { status: 'published', createdAt: { gte: oneMonthAgo } },
        select: { id: true, title: true, slug: true, type: true, editorialScore: true },
      })

      // Get comprehensive data for the PDF report
      const allMonthlySignals = await db.observatoryChange.findMany({
        where: { isSignal: true, createdAt: { gte: oneMonthAgo } },
        orderBy: { significanceScore: 'desc' },
        take: 20,
      })

      const allIndustries = await db.observatoryIndustry.findMany({
        select: { name: true, slug: true, aiVisibilityAvg: true },
        orderBy: { aiVisibilityAvg: 'desc' },
      })

      const totalCrawlsAllTime = await db.observatoryCrawl.count()
      const totalSignalsAllTime = await db.observatoryChange.count({ where: { isSignal: true } })

      const pdfReportPrompt = `Generate a comprehensive, PDF-ready monthly report for the AI Visibility Observatory. This report should be suitable for executive review and client distribution.

MONTHLY OVERVIEW:
- Crawls this month: ${summary.monthlyReport && typeof summary.monthlyReport === 'object' && 'stats' in (summary.monthlyReport as object) ? (summary.monthlyReport as { stats: { monthlyCrawls: number } }).stats.monthlyCrawls : 'N/A'}
- Signals this month: ${allMonthlySignals.length}
- Published reports: ${monthlyPublishedReports.length}
- All-time crawls: ${totalCrawlsAllTime}
- All-time signals: ${totalSignalsAllTime}

INDUSTRY RANKINGS:
${allIndustries.map((ind, i) => `#${i + 1}: ${ind.name} — AI Visibility: ${ind.aiVisibilityAvg.toFixed(2)}`).join('\n') || 'No industry data'}

PUBLISHED REPORTS THIS MONTH:
${monthlyPublishedReports.map((r) => `- "${r.title}" (${r.type}, editorial score: ${r.editorialScore.toFixed(2)})`).join('\n') || 'No published reports'}

TOP SIGNALS SUMMARY:
${allMonthlySignals.slice(0, 5).map((s, i) => `#${i + 1}: ${s.aiModel} — ${s.changeType} (${s.significanceScore.toFixed(2)})`).join('\n') || 'No signals'}

Return ONLY valid JSON:
{
  "title": "AI Visibility Observatory — Comprehensive Monthly Report [Month Year]",
  "subtitle": "Executive Summary & Strategic Intelligence",
  "summary": "High-level executive summary",
  "executiveHighlights": ["highlight 1", "highlight 2", "highlight 3"],
  "sections": [
    { "heading": "Executive Summary", "content": "Overview in markdown" },
    { "heading": "Key Metrics & KPIs", "content": "Quantitative overview in markdown with tables" },
    { "heading": "AI Model Behavior Analysis", "content": "Detailed model analysis in markdown" },
    { "heading": "Industry Intelligence", "content": "Industry-specific insights in markdown" },
    { "heading": "Signal Deep Dive", "content": "Top signals analysis in markdown" },
    { "heading": "Strategic Recommendations", "content": "Actionable recommendations in markdown" },
    { "heading": "Appendix: Data Tables", "content": "Supporting data in markdown" }
  ],
  "conclusion": "Strategic outlook and next steps",
  "pdfMetadata": {
    "author": "SeoSights AI Visibility Observatory",
    "subject": "Monthly AI Visibility Report",
    "keywords": ["AI visibility", "AI search", "observatory", "monthly report"]
  }
}

This is a premium, client-facing report — make it exceptional, comprehensive, and at least 1500 words.`

      const result = await routeLLM([
          {
            role: 'system',
            content:
              'You are a senior research director who authors premium, client-facing AI visibility reports suitable for PDF publication. You must return ONLY valid JSON with no extra commentary.',
          },
          { role: 'user', content: pdfReportPrompt },
        ],
        { taskType: 'long_report' }
      )

      const raw = result.content || ''
      const parsed = parseLLMJson(raw)

      const markdownSections = (parsed.sections || [])
        .map((s: { heading: string; content: string }) => `## ${s.heading}\n\n${s.content}`)
        .join('\n\n')

      const subtitleSection = parsed.subtitle ? `\n*${parsed.subtitle}*\n\n` : ''
      const contentMarkdown = `# ${parsed.title}\n\n${subtitleSection}${parsed.summary}\n\n${markdownSections}\n\n## Conclusion\n\n${parsed.conclusion || ''}`
      const wordCount = contentMarkdown.split(/\s+/).length
      const readingTimeMin = Math.max(1, Math.ceil(wordCount / 250))

      const baseSlug = slugify(String(parsed.title || 'comprehensive-monthly-report'))
      const slug = `${baseSlug}-${Date.now().toString(36)}`

      const report = await db.observatoryReport.create({
        data: {
          slug,
          title: String(parsed.title || 'Comprehensive Monthly Report').slice(0, 200),
          type: 'monthly_report',
          status: 'proposed',
          editorialScore: 0,
          aiModels: JSON.stringify([]),
          categories: JSON.stringify(['comprehensive', 'monthly', 'pdf_ready']),
          contentJson: JSON.stringify(parsed),
          contentMarkdown,
          summary: String(parsed.summary || '').slice(0, 1000),
          keyFindings: JSON.stringify(parsed.executiveHighlights || []),
          relatedReports: JSON.stringify(monthlyPublishedReports.map((r) => r.id)),
          relatedChanges: JSON.stringify(allMonthlySignals.slice(0, 15).map((s) => s.id)),
          wordCount,
          readingTimeMin,
        },
      })

      summary.comprehensiveReport = {
        reportId: report.id,
        slug: report.slug,
        title: report.title,
        wordCount,
        readingTimeMin,
        referencesPublishedReports: monthlyPublishedReports.length,
        referencesSignals: allMonthlySignals.length,
      }

      console.log(
        `[cron/observatory-monthly] Step 5 complete: PDF-ready report "${report.title}" (${wordCount} words)`
      )
    } catch (step5Error) {
      const msg = step5Error instanceof Error ? step5Error.message : 'Unknown error'
      summary.errors.push(`Comprehensive report step failed: ${msg}`)
      summary.comprehensiveReport = { failed: true, error: msg }
      console.error('[cron/observatory-monthly] Step 5 failed:', msg)
    }
  } catch (fatalError) {
    const msg = fatalError instanceof Error ? fatalError.message : 'Unknown error'
    summary.errors.push(`Fatal error: ${msg}`)
    console.error('[cron/observatory-monthly] Fatal error:', msg)
  }

  summary.totalDurationMs = Date.now() - pipelineStart

  console.log(
    `[cron/observatory-monthly] Pipeline complete in ${summary.totalDurationMs}ms with ${summary.errors.length} errors`
  )

  return NextResponse.json({
    pipeline: 'observatory-monthly',
    schedule: '1st of every month at 06:00 UTC',
    timestamp: new Date().toISOString(),
    summary,
  })
}
