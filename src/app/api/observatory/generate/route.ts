import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'
import { extractJsonObject } from '@/lib/llm-utils'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

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
 * Try to generate an observatory report from signals using the LLM.
 * Uses jsonMode for structured output and retries with a fallback model
 * if the primary model fails to produce parseable JSON.
 */
async function generateReportFromSignals(
  signalContext: string,
): Promise<{ raw: string; jsonStr: string; model: string } | null> {
  const systemPrompt = `You are an expert research analyst who writes high-quality reports about AI model behavior, visibility, and search trends.

CRITICAL OUTPUT REQUIREMENT: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no commentary, no code fences. Just the raw JSON object starting with { and ending with }. Do NOT wrap it in code blocks. Do NOT add any text before or after the JSON.`

  const generationPrompt = `Based on these AI observability signals, generate a comprehensive research report.

SIGNALS:
${signalContext}

Respond with a JSON object exactly matching this schema (no extra keys, no missing keys):
{
  "title": "string — Compelling, SEO-friendly title",
  "type": "string — one of: research, blog, industry_update, benchmark, monthly_report",
  "summary": "string — 2-3 sentence executive summary",
  "keyFindings": ["string — finding 1", "string — finding 2", "string — finding 3"],
  "sections": [{"heading": "string", "content": "string — markdown content with analysis"}],
  "conclusion": "string — actionable takeaways",
  "aiModels": ["string — AI models mentioned"],
  "categories": ["string — categories mentioned"]
}

The report should be data-driven, actionable for businesses tracking AI visibility, professional tone, at least 800 words total content.

IMPORTANT: Output ONLY the JSON object. Start your response with { and end with }. Nothing else.`

  // Strategy: Try 3 approaches with decreasing complexity
  // 1. Full fallback chain with jsonMode (most models should work)
  // 2. Full fallback chain without jsonMode (some models produce better JSON without the constraint)
  // 3. Simple prompt on Groq (fast, reliable, free — always produces JSON)

  const approaches = [
    { label: 'jsonMode-full-chain', jsonMode: true, temperature: 0.4, taskType: 'long_report' as const },
    { label: 'no-jsonMode-full-chain', jsonMode: false, temperature: 0.4, taskType: 'long_report' as const },
    { label: 'groq-reliable-fallback', jsonMode: true, temperature: 0.3, taskType: 'classification' as const, preferredModel: 'groq/llama-3.1-70b' },
  ]

  for (const approach of approaches) {
    try {
      console.log(`[observatory/generate] Trying approach: ${approach.label}`)
      const result = await routeLLM(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: generationPrompt },
        ],
        {
          taskType: approach.taskType,
          jsonMode: approach.jsonMode,
          preferredModel: approach.preferredModel,
          temperature: approach.temperature,
          maxTokens: 4096,
          timeout: 60000,
        }
      )

      const raw = result.content || ''
      console.log(`[observatory/generate] Approach ${approach.label}: model=${result.model}, rawLength=${raw.length}, first200=${raw.slice(0, 200)}`)

      if (!raw || raw.trim().length === 0) {
        console.warn(`[observatory/generate] Approach ${approach.label}: empty response, trying next`)
        continue
      }

      const jsonStr = extractJsonObject(raw)
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr)
          // Validate minimum structure for a report
          if (parsed.title && parsed.summary) {
            console.log(`[observatory/generate] Approach ${approach.label} SUCCESS with model ${result.model}`)
            return { raw, jsonStr, model: result.model || approach.label }
          }
          console.warn(`[observatory/generate] Approach ${approach.label}: JSON parsed but missing title/summary, trying next`)
          continue
        } catch {
          console.warn(`[observatory/generate] Approach ${approach.label}: JSON.parse failed, trying next`)
          continue
        }
      }

      console.warn(`[observatory/generate] Approach ${approach.label}: extractJsonObject returned null, trying next`)
    } catch (err) {
      console.warn(`[observatory/generate] Approach ${approach.label} failed: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }

  return null
}

/**
 * POST /api/observatory/generate
 * Generate content (reports) from signals.
 * Gets all signaled changes that don't have reports yet and uses LLM to generate research reports.
 */
export async function POST() {
  try {
    // Get all signaled changes (isSignal = true)
    const signals = await db.observatoryChange.findMany({
      where: { isSignal: true },
      orderBy: { significanceScore: 'desc' },
      take: 15,
    })

    if (signals.length === 0) {
      return NextResponse.json({
        message: 'No signals found. Run detection and engine evaluation first.',
        reportId: null,
      })
    }

    // Check which signals already have reports (via relatedChanges field)
    const existingReports = await db.observatoryReport.findMany({
      select: { relatedChanges: true },
    })
    const reportedChangeIds = new Set<string>()
    for (const report of existingReports) {
      try {
        const ids = JSON.parse(report.relatedChanges || '[]') as string[]
        ids.forEach((id) => reportedChangeIds.add(id))
      } catch {
        // Skip malformed JSON
      }
    }

    // Filter to only unreported changes
    const unreportedSignals = signals.filter((s) => !reportedChangeIds.has(s.id))

    if (unreportedSignals.length === 0) {
      return NextResponse.json({
        message: 'All current signals already have reports.',
        reportId: null,
      })
    }

    // Build context for LLM
    const signalContext = unreportedSignals
      .map((s, i) => `[Signal ${i + 1}]
AI Model: ${s.aiModel}
Change Type: ${s.changeType}
Category: ${s.category}
Before: ${s.beforeSummary}
After: ${s.afterSummary}
Significance: ${s.significanceScore.toFixed(2)}
Reason: ${s.signalReason || 'N/A'}`)
      .join('\n\n')

    // Generate report with retry/fallback across models
    const reportResult = await generateReportFromSignals(signalContext)

    if (!reportResult) {
      console.error('[observatory/generate] All models failed to produce valid JSON')
      return NextResponse.json(
        { error: 'Report generation failed', details: 'All LLM models failed to produce valid JSON output. This may indicate an API key issue or model availability problem.' },
        { status: 500 }
      )
    }

    const { jsonStr, model: usedModel } = reportResult

    interface ObservatoryReportJson {
      title: string
      type: string
      summary: string
      keyFindings: string[]
      sections: Array<{ heading: string; content: string }>
      conclusion: string
      aiModels: string[]
      categories: string[]
    }

    const parsed = JSON.parse(jsonStr) as ObservatoryReportJson

    // Build the full markdown content
    const markdownSections = (parsed.sections || [])
      .map((s) => `## ${s.heading}\n\n${s.content}`)
      .join('\n\n')

    const contentMarkdown = `# ${parsed.title}\n\n${parsed.summary}\n\n${markdownSections}\n\n## Conclusion\n\n${parsed.conclusion || ''}`
    const wordCount = contentMarkdown.split(/\s+/).length
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 250))

    // Generate a unique slug
    const baseSlug = slugify(parsed.title || 'ai-observatory-report')
    const slugSuffix = Date.now().toString(36)
    const slug = `${baseSlug}-${slugSuffix}`

    // Create the report
    const report = await db.observatoryReport.create({
      data: {
        slug,
        title: String(parsed.title || 'AI Observatory Report').slice(0, 200),
        type: ['research', 'blog', 'industry_update', 'benchmark', 'monthly_report'].includes(parsed.type)
          ? parsed.type
          : 'research',
        status: 'proposed',
        editorialScore: 0,
        aiModels: JSON.stringify(parsed.aiModels || []),
        categories: JSON.stringify(parsed.categories || []),
        contentJson: JSON.stringify(parsed),
        contentMarkdown,
        summary: String(parsed.summary || '').slice(0, 1000),
        keyFindings: JSON.stringify(parsed.keyFindings || []),
        relatedChanges: JSON.stringify(unreportedSignals.map((s) => s.id)),
        wordCount,
        readingTimeMin,
      },
    })

    console.log(`[observatory/generate] Report created: ${report.id} using model ${usedModel}`)

    return NextResponse.json({
      reportId: report.id,
      slug: report.slug,
      title: report.title,
      type: report.type,
      status: report.status,
      wordCount,
      readingTimeMin,
      signalsProcessed: unreportedSignals.length,
      modelUsed: usedModel,
    })
  } catch (error) {
    console.error('[observatory/generate] POST error:', error)
    return NextResponse.json(
      { error: 'Report generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/observatory/generate
 * List generated reports.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
    const status = url.searchParams.get('status')

    const where = status ? { status } : {}

    const reports = await db.observatoryReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        status: true,
        editorialScore: true,
        summary: true,
        keyFindings: true,
        wordCount: true,
        readingTimeMin: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const total = await db.observatoryReport.count({ where })

    return NextResponse.json({ reports, total })
  } catch (error) {
    console.error('[observatory/generate] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
