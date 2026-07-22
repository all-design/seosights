/**
 * Cron API — Observatory Weekly Pipeline
 *
 * GET /api/cron/observatory-weekly
 *
 * Schedule: Every Monday at 09:00 UTC
 * Purpose: Weekly industry reports, top movers, programmatic SEO updates, and weekly summary.
 *
 * Pipeline steps:
 * 1. Generate industry reports for tracked industries
 * 2. Create "Top Movers" reports (biggest AI visibility changes in the past week)
 * 3. Update programmatic SEO industry pages
 * 4. Generate a weekly summary report
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

/**
 * Parse JSON from LLM response, handling markdown code blocks and trailing commas.
 */
function parseLLMJson(raw: string): any {
  let cleaned = raw.trim()
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) cleaned = jsonMatch[1].trim()
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')
  return JSON.parse(cleaned)
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
 * GET handler — runs the weekly observatory pipeline.
 */
export async function GET() {
  const pipelineStart = Date.now()
  const summary: {
    industryReports: Record<string, unknown> | null
    topMovers: Record<string, unknown> | null
    industryPageUpdates: Record<string, unknown> | null
    weeklySummary: Record<string, unknown> | null
    errors: string[]
    totalDurationMs: number
  } = {
    industryReports: null,
    topMovers: null,
    industryPageUpdates: null,
    weeklySummary: null,
    errors: [],
    totalDurationMs: 0,
  }

  try {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Generate industry reports for tracked industries
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-weekly] Step 1: Generating industry reports...')

    try {
      const industries = await db.observatoryIndustry.findMany({
        where: {},
      })

      // Also ensure we have default industries if none exist
      if (industries.length === 0) {
        const defaultIndustries = [
          { slug: 'dentists', name: 'Dentists', description: 'Dental practices and oral healthcare providers' },
          { slug: 'law-firms', name: 'Law Firms', description: 'Legal services and law firms' },
          { slug: 'real-estate', name: 'Real Estate', description: 'Real estate agencies and property services' },
          { slug: 'accountants', name: 'Accountants', description: 'Accounting and tax preparation firms' },
          { slug: 'restaurants', name: 'Restaurants', description: 'Restaurants and food service businesses' },
        ]

        for (const ind of defaultIndustries) {
          await db.observatoryIndustry.create({
            data: {
              slug: ind.slug,
              name: ind.name,
              description: ind.description,
            },
          })
        }

        // Re-fetch
        const createdIndustries = await db.observatoryIndustry.findMany()
        industries.push(...createdIndustries)
      }

      // Get weekly signals grouped by category
      const weeklySignals = await db.observatoryChange.findMany({
        where: {
          isSignal: true,
          createdAt: { gte: oneWeekAgo },
        },
        orderBy: { significanceScore: 'desc' },
        take: 20,
      })

      let industryReportsGenerated = 0
      const industryErrors: string[] = []

      // Generate a report for each industry using LLM (limit to 3 to control LLM usage)
      const industriesToProcess = industries.slice(0, 3)

      for (const industry of industriesToProcess) {
        try {
          // Gather signals relevant to this industry
          const industrySignals = weeklySignals.filter(
            (s) =>
              s.category === 'industry_query' ||
              s.category === 'recommendation_query' ||
              s.afterSummary.toLowerCase().includes(industry.name.toLowerCase()) ||
              s.beforeSummary.toLowerCase().includes(industry.name.toLowerCase())
          )

          const signalContext =
            industrySignals.length > 0
              ? industrySignals
                  .map(
                    (s, i) =>
                      `[Signal ${i + 1}] Model: ${s.aiModel}, Type: ${s.changeType}, Before: ${s.beforeSummary}, After: ${s.afterSummary}, Score: ${s.significanceScore.toFixed(2)}`
                  )
                  .join('\n')
              : 'No specific signals detected for this industry this week.'

          const industryPrompt = `Generate a weekly industry report for the "${industry.name}" industry about AI visibility trends.

Industry: ${industry.name}
Description: ${industry.description || 'N/A'}

This week's relevant AI observability signals:
${signalContext}

Return ONLY valid JSON:
{
  "title": "Weekly AI Visibility Report: [Industry] — [Week Date Range]",
  "summary": "2-3 sentence executive summary of AI visibility trends for this industry",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "sections": [
    { "heading": "Section Title", "content": "Section content in markdown" }
  ],
  "conclusion": "Actionable takeaways",
  "topModels": ["which AI models are most relevant for this industry"],
  "recommendations": ["what businesses in this industry should do"]
}

Make the report insightful, actionable, and at least 600 words.`

          const result = await routeLLM([
              {
                role: 'system',
                content:
                  'You are an expert industry analyst who writes weekly AI visibility reports for specific industries. You must return ONLY valid JSON with no extra commentary.',
              },
              { role: 'user', content: industryPrompt },
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

          const baseSlug = slugify(String(parsed.title || `weekly-${industry.slug}`))
          const slug = `${baseSlug}-${Date.now().toString(36)}`

          await db.observatoryReport.create({
            data: {
              slug,
              title: String(parsed.title || `Weekly Report: ${industry.name}`).slice(0, 200),
              type: 'industry_update',
              status: 'proposed',
              editorialScore: 0,
              aiModels: JSON.stringify(parsed.topModels || []),
              categories: JSON.stringify([industry.slug]),
              contentJson: JSON.stringify(parsed),
              contentMarkdown,
              summary: String(parsed.summary || '').slice(0, 1000),
              keyFindings: JSON.stringify(parsed.keyFindings || []),
              relatedChanges: JSON.stringify(industrySignals.map((s) => s.id)),
              wordCount,
              readingTimeMin,
            },
          })

          industryReportsGenerated++
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error'
          industryErrors.push(`${industry.name}: ${errMsg}`)
        }
      }

      summary.industryReports = {
        industriesProcessed: industriesToProcess.length,
        totalIndustries: industries.length,
        reportsGenerated: industryReportsGenerated,
        weeklySignalsAvailable: weeklySignals.length,
        errors: industryErrors.length,
      }

      if (industryErrors.length > 0) {
        summary.errors.push(`Industry report errors: ${industryErrors.join('; ')}`)
      }

      console.log(
        `[cron/observatory-weekly] Step 1 complete: ${industryReportsGenerated}/${industriesToProcess.length} reports generated`
      )
    } catch (step1Error) {
      const msg = step1Error instanceof Error ? step1Error.message : 'Unknown error'
      summary.errors.push(`Industry reports step failed: ${msg}`)
      summary.industryReports = { failed: true, error: msg }
      console.error('[cron/observatory-weekly] Step 1 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Create "Top Movers" report
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-weekly] Step 2: Generating Top Movers report...')

    try {
      // Get the most significant changes from the past week
      const topMovers = await db.observatoryChange.findMany({
        where: {
          isSignal: true,
          createdAt: { gte: oneWeekAgo },
        },
        orderBy: { significanceScore: 'desc' },
        take: 10,
      })

      // Also get all changes for context
      const totalWeeklyChanges = await db.observatoryChange.count({
        where: { createdAt: { gte: oneWeekAgo } },
      })

      const totalWeeklySignals = await db.observatoryChange.count({
        where: { isSignal: true, createdAt: { gte: oneWeekAgo } },
      })

      if (topMovers.length === 0) {
        summary.topMovers = {
          skipped: true,
          reason: 'No significant signals this week to create a Top Movers report',
        }
      } else {
        const moversContext = topMovers
          .map(
            (m, i) =>
              `#${i + 1}: ${m.aiModel} — ${m.changeType} in ${m.category} (score: ${m.significanceScore.toFixed(2)})\n  Before: ${m.beforeSummary}\n  After: ${m.afterSummary}`
          )
          .join('\n\n')

        const moversPrompt = `Generate a "Top Movers" weekly report highlighting the biggest AI visibility changes this week.

TOP MOVERS THIS WEEK:
${moversContext}

SUMMARY STATS:
- Total changes detected: ${totalWeeklyChanges}
- Total signals: ${totalWeeklySignals}
- Top mover score: ${topMovers[0]?.significanceScore.toFixed(2)}

Return ONLY valid JSON:
{
  "title": "Top AI Visibility Movers — Week of [date]",
  "summary": "2-3 sentence summary of the week's AI visibility movements",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "sections": [
    { "heading": "Section Title", "content": "Section content in markdown" }
  ],
  "conclusion": "What these movements mean for businesses",
  "topModels": ["which AI models showed the most change"],
  "moversRanked": [
    { "rank": 1, "model": "model name", "change": "description", "significance": 0.9 }
  ]
}

Make it engaging and at least 600 words.`

        const result = await routeLLM([
            {
              role: 'system',
              content:
                'You are an expert analyst who writes engaging "Top Movers" reports about changes in AI model behavior and visibility. You must return ONLY valid JSON with no extra commentary.',
            },
            { role: 'user', content: moversPrompt },
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

        const baseSlug = slugify(String(parsed.title || 'top-ai-visibility-movers'))
        const slug = `${baseSlug}-${Date.now().toString(36)}`

        const report = await db.observatoryReport.create({
          data: {
            slug,
            title: String(parsed.title || 'Top AI Visibility Movers This Week').slice(0, 200),
            type: 'benchmark',
            status: 'proposed',
            editorialScore: 0,
            aiModels: JSON.stringify(parsed.topModels || []),
            categories: JSON.stringify(['top_movers', 'weekly']),
            contentJson: JSON.stringify(parsed),
            contentMarkdown,
            summary: String(parsed.summary || '').slice(0, 1000),
            keyFindings: JSON.stringify(parsed.keyFindings || []),
            relatedChanges: JSON.stringify(topMovers.map((m) => m.id)),
            wordCount,
            readingTimeMin,
          },
        })

        summary.topMovers = {
          reportId: report.id,
          slug: report.slug,
          title: report.title,
          wordCount,
          signalsAnalyzed: topMovers.length,
          totalWeeklyChanges,
          totalWeeklySignals,
        }

        console.log(
          `[cron/observatory-weekly] Step 2 complete: Top Movers report "${report.title}" (${wordCount} words)`
        )
      }
    } catch (step2Error) {
      const msg = step2Error instanceof Error ? step2Error.message : 'Unknown error'
      summary.errors.push(`Top Movers step failed: ${msg}`)
      summary.topMovers = { failed: true, error: msg }
      console.error('[cron/observatory-weekly] Step 2 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Update programmatic SEO industry pages
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-weekly] Step 3: Updating industry pages...')

    try {
      const industries = await db.observatoryIndustry.findMany()
      let pagesUpdated = 0
      const pageErrors: string[] = []

      // Get weekly response data grouped by model
      const weeklyResponsesByModel = await db.observatoryResponse.groupBy({
        by: ['aiModel'],
        where: { createdAt: { gte: oneWeekAgo } },
        _count: { id: true },
      })

      const modelResponseMap = new Map(
        weeklyResponsesByModel.map((r) => [r.aiModel, r._count.id])
      )

      for (const industry of industries) {
        try {
          // Get relevant signals for this industry
          const industrySignals = await db.observatoryChange.findMany({
            where: {
              isSignal: true,
              createdAt: { gte: oneWeekAgo },
              category: { in: ['industry_query', 'recommendation_query'] },
            },
            orderBy: { significanceScore: 'desc' },
            take: 5,
          })

          // Calculate a visibility average based on signals
          const avgSignificance =
            industrySignals.length > 0
              ? industrySignals.reduce((sum, s) => sum + s.significanceScore, 0) / industrySignals.length
              : industry.aiVisibilityAvg

          // Build top models json
          const topModels = Array.from(modelResponseMap.entries())
            .map(([model, count]) => ({ model, responses: count }))
            .sort((a, b) => b.responses - a.responses)
            .slice(0, 5)

          // Build rankings json (based on signal data)
          const rankings = industrySignals
            .map((s) => ({
              aiModel: s.aiModel,
              changeType: s.changeType,
              significance: s.significanceScore,
              summary: s.afterSummary.slice(0, 100),
            }))
            .slice(0, 10)

          // Build benchmarks
          const benchmarks = {
            totalSignalsThisWeek: industrySignals.length,
            avgSignificance: avgSignificance.toFixed(2),
            topChangeType: industrySignals.length > 0
              ? industrySignals.reduce((acc, s) => {
                  acc[s.changeType] = (acc[s.changeType] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              : {},
          }

          await db.observatoryIndustry.update({
            where: { id: industry.id },
            data: {
              aiVisibilityAvg: avgSignificance,
              topModelsJson: JSON.stringify(topModels),
              rankingsJson: JSON.stringify(rankings),
              benchmarksJson: JSON.stringify(benchmarks),
              lastUpdated: new Date(),
            },
          })

          pagesUpdated++
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error'
          pageErrors.push(`${industry.name}: ${errMsg}`)
        }
      }

      summary.industryPageUpdates = {
        industriesUpdated: pagesUpdated,
        totalIndustries: industries.length,
        errors: pageErrors.length,
      }

      if (pageErrors.length > 0) {
        summary.errors.push(`Industry page update errors: ${pageErrors.join('; ')}`)
      }

      console.log(
        `[cron/observatory-weekly] Step 3 complete: ${pagesUpdated}/${industries.length} industry pages updated`
      )
    } catch (step3Error) {
      const msg = step3Error instanceof Error ? step3Error.message : 'Unknown error'
      summary.errors.push(`Industry page updates step failed: ${msg}`)
      summary.industryPageUpdates = { failed: true, error: msg }
      console.error('[cron/observatory-weekly] Step 3 failed:', msg)
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Generate weekly summary report
    // ═══════════════════════════════════════════════════════════════
    console.log('[cron/observatory-weekly] Step 4: Generating weekly summary report...')

    try {
      // Gather comprehensive weekly stats
      const [
        weeklyCrawls,
        weeklyResponses,
        weeklyChanges,
        weeklySignals,
        weeklyReports,
      ] = await Promise.all([
        db.observatoryCrawl.count({ where: { createdAt: { gte: oneWeekAgo } } }),
        db.observatoryResponse.count({ where: { createdAt: { gte: oneWeekAgo } } }),
        db.observatoryChange.count({ where: { createdAt: { gte: oneWeekAgo } } }),
        db.observatoryChange.count({ where: { isSignal: true, createdAt: { gte: oneWeekAgo } } }),
        db.observatoryReport.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      ])

      // Get signal breakdown by model
      const signalsByModel = await db.observatoryChange.groupBy({
        by: ['aiModel'],
        where: { isSignal: true, createdAt: { gte: oneWeekAgo } },
        _count: { id: true },
        _avg: { significanceScore: true },
      })

      // Get signal breakdown by type
      const signalsByType = await db.observatoryChange.groupBy({
        by: ['changeType'],
        where: { isSignal: true, createdAt: { gte: oneWeekAgo } },
        _count: { id: true },
      })

      // Get top 5 signals this week
      const topSignals = await db.observatoryChange.findMany({
        where: { isSignal: true, createdAt: { gte: oneWeekAgo } },
        orderBy: { significanceScore: 'desc' },
        take: 5,
      })

      const weeklySummaryPrompt = `Generate a weekly AI Visibility Observatory summary report.

WEEKLY STATS:
- Crawls performed: ${weeklyCrawls}
- AI model responses collected: ${weeklyResponses}
- Changes detected: ${weeklyChanges}
- Signals identified: ${weeklySignals}
- Reports generated: ${weeklyReports}

SIGNALS BY MODEL:
${signalsByModel.map((s) => `- ${s.aiModel}: ${s._count.id} signals (avg significance: ${s._avg.significanceScore?.toFixed(2) || '0.00'})`).join('\n') || 'No model data this week'}

SIGNALS BY TYPE:
${signalsByType.map((s) => `- ${s.changeType}: ${s._count.id}`).join('\n') || 'No type data this week'}

TOP 5 SIGNALS:
${topSignals.map((s, i) => `#${i + 1}: ${s.aiModel} — ${s.changeType} (score: ${s.significanceScore.toFixed(2)})\n  Before: ${s.beforeSummary}\n  After: ${s.afterSummary}`).join('\n\n') || 'No signals this week'}

Return ONLY valid JSON:
{
  "title": "AI Visibility Observatory — Weekly Summary [date range]",
  "summary": "Executive summary of the week",
  "keyFindings": ["finding 1", "finding 2", "finding 3", "finding 4"],
  "sections": [
    { "heading": "Section Title", "content": "Section content in markdown" }
  ],
  "conclusion": "What this week means for AI visibility strategy",
  "outlook": "Brief outlook for next week",
  "topModels": ["which models were most active"]
}

Make it comprehensive and at least 800 words.`

      const result = await routeLLM([
          {
            role: 'system',
            content:
              'You are an expert analyst who writes comprehensive weekly summary reports about AI model behavior and visibility trends. You must return ONLY valid JSON with no extra commentary.',
          },
          { role: 'user', content: weeklySummaryPrompt },
        ],
        { taskType: 'long_report' }
      )

      const raw = result.content || ''
      const parsed = parseLLMJson(raw)

      const markdownSections = (parsed.sections || [])
        .map((s: { heading: string; content: string }) => `## ${s.heading}\n\n${s.content}`)
        .join('\n\n')

      const outlookSection = parsed.outlook ? `\n\n## Outlook\n\n${parsed.outlook}` : ''
      const contentMarkdown = `# ${parsed.title}\n\n${parsed.summary}\n\n${markdownSections}\n\n## Conclusion\n\n${parsed.conclusion || ''}${outlookSection}`
      const wordCount = contentMarkdown.split(/\s+/).length
      const readingTimeMin = Math.max(1, Math.ceil(wordCount / 250))

      const baseSlug = slugify(String(parsed.title || 'weekly-ai-visibility-summary'))
      const slug = `${baseSlug}-${Date.now().toString(36)}`

      const report = await db.observatoryReport.create({
        data: {
          slug,
          title: String(parsed.title || 'Weekly AI Visibility Summary').slice(0, 200),
          type: 'blog',
          status: 'proposed',
          editorialScore: 0,
          aiModels: JSON.stringify(parsed.topModels || []),
          categories: JSON.stringify(['weekly_summary']),
          contentJson: JSON.stringify(parsed),
          contentMarkdown,
          summary: String(parsed.summary || '').slice(0, 1000),
          keyFindings: JSON.stringify(parsed.keyFindings || []),
          relatedChanges: JSON.stringify(topSignals.map((s) => s.id)),
          wordCount,
          readingTimeMin,
        },
      })

      summary.weeklySummary = {
        reportId: report.id,
        slug: report.slug,
        title: report.title,
        wordCount,
        stats: {
          weeklyCrawls,
          weeklyResponses,
          weeklyChanges,
          weeklySignals,
          weeklyReports,
        },
      }

      console.log(
        `[cron/observatory-weekly] Step 4 complete: Weekly summary "${report.title}" (${wordCount} words)`
      )
    } catch (step4Error) {
      const msg = step4Error instanceof Error ? step4Error.message : 'Unknown error'
      summary.errors.push(`Weekly summary step failed: ${msg}`)
      summary.weeklySummary = { failed: true, error: msg }
      console.error('[cron/observatory-weekly] Step 4 failed:', msg)
    }
  } catch (fatalError) {
    const msg = fatalError instanceof Error ? fatalError.message : 'Unknown error'
    summary.errors.push(`Fatal error: ${msg}`)
    console.error('[cron/observatory-weekly] Fatal error:', msg)
  }

  summary.totalDurationMs = Date.now() - pipelineStart

  console.log(
    `[cron/observatory-weekly] Pipeline complete in ${summary.totalDurationMs}ms with ${summary.errors.length} errors`
  )

  return NextResponse.json({
    pipeline: 'observatory-weekly',
    schedule: 'Every Monday at 09:00 UTC',
    timestamp: new Date().toISOString(),
    summary,
  })
}
