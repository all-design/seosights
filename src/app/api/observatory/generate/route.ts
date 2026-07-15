import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getZAI } from '@/lib/zai'

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

    // Filter to only unsignaled changes
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

    const zai = await getZAI()

    const generationPrompt = `Based on these AI observability signals, generate a comprehensive research report.

SIGNALS:
${signalContext}

Generate a research report with the following structure. Return ONLY valid JSON:
{
  "title": "Compelling, SEO-friendly title for this report",
  "type": "research" | "blog" | "industry_update" | "benchmark" | "monthly_report",
  "summary": "2-3 sentence executive summary",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "sections": [
    {
      "heading": "Section Title",
      "content": "Section content in markdown format with analysis and insights"
    }
  ],
  "conclusion": "Conclusion and actionable takeaways",
  "aiModels": ["list of AI models mentioned"],
  "categories": ["list of categories mentioned"]
}

The report should be:
- Data-driven and analytical
- Actionable for businesses tracking AI visibility
- Written in a professional but accessible tone
- At least 800 words in total content`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert research analyst who writes high-quality reports about AI model behavior, visibility, and search trends. You must return ONLY valid JSON with no extra commentary.',
        },
        { role: 'user', content: generationPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices?.[0]?.message?.content || ''
    let cleaned = raw.trim()
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) cleaned = jsonMatch[1].trim()
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

    const parsed = JSON.parse(cleaned)

    // Build the full markdown content
    const markdownSections = (parsed.sections || [])
      .map((s: { heading: string; content: string }) => `## ${s.heading}\n\n${s.content}`)
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

    return NextResponse.json({
      reportId: report.id,
      slug: report.slug,
      title: report.title,
      type: report.type,
      status: report.status,
      wordCount,
      readingTimeMin,
      signalsProcessed: unreportedSignals.length,
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
