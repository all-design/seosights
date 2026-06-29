import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

/**
 * POST /api/observatory/publish
 * Editorial AI scoring + publishing.
 * Scores proposed reports and publishes those with score > 0.7.
 */
export async function POST() {
  try {
    // Get all "proposed" reports
    const proposedReports = await db.observatoryReport.findMany({
      where: { status: 'proposed' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    if (proposedReports.length === 0) {
      return NextResponse.json({
        message: 'No proposed reports to evaluate.',
        published: 0,
        rejected: 0,
      })
    }

    const zai = await ZAI.create()
    let published = 0
    let rejected = 0
    const results: Array<{
      reportId: string
      title: string
      editorialScore: number
      action: 'published' | 'draft'
      reason: string
    }> = []

    // Process each report
    for (const report of proposedReports) {
      try {
        const contentPreview = (report.contentMarkdown || '').slice(0, 3000)

        const evaluationPrompt = `You are an editorial AI scoring engine for a research publication. Evaluate this report for editorial quality.

Report Title: ${report.title}
Report Type: ${report.type}
Summary: ${report.summary || 'No summary'}
Key Findings: ${report.keyFindings || 'None'}
Word Count: ${report.wordCount}

Content Preview:
${contentPreview}

Evaluate on these criteria (0-1 each):
1. Accuracy — Is the information well-supported and credible?
2. Clarity — Is the writing clear and well-structured?
3. Actionability — Does it provide actionable insights?
4. Originality — Does it offer new perspectives or analysis?
5. Readability — Is it well-formatted and easy to consume?

Return ONLY valid JSON:
{
  "editorialScore": 0.0-1.0,
  "accuracy": 0.0-1.0,
  "clarity": 0.0-1.0,
  "actionability": 0.0-1.0,
  "originality": 0.0-1.0,
  "readability": 0.0-1.0,
  "approved": true/false,
  "reason": "Brief explanation of the editorial decision",
  "suggestions": ["improvement suggestions if any"]
}`

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are an expert editorial AI that evaluates research reports for publication quality. You must return ONLY valid JSON with no extra commentary.',
            },
            { role: 'user', content: evaluationPrompt },
          ],
          thinking: { type: 'disabled' },
        })

        const raw = completion.choices?.[0]?.message?.content || ''
        let cleaned = raw.trim()
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch) cleaned = jsonMatch[1].trim()
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

        const parsed = JSON.parse(cleaned)
        const editorialScore = Math.min(1, Math.max(0, Number(parsed.editorialScore) || 0))
        const isApproved = editorialScore > 0.7

        if (isApproved) {
          // Publish the report
          await db.observatoryReport.update({
            where: { id: report.id },
            data: {
              status: 'published',
              editorialScore,
              editorialReason: String(parsed.reason || 'Approved by editorial AI').slice(0, 500),
              publishedAt: new Date(),
            },
          })

          // Create publication records
          const channels = ['website', 'newsletter']
          for (const channel of channels) {
            await db.observatoryPublication.create({
              data: {
                reportId: report.id,
                channel,
                status: 'published',
                publishedUrl: `/research/${report.slug}`,
                publishedAt: new Date(),
                reachEstimate: channel === 'website' ? 5000 : 2000,
              },
            })
          }

          published++
          results.push({
            reportId: report.id,
            title: report.title,
            editorialScore,
            action: 'published',
            reason: String(parsed.reason || '').slice(0, 200),
          })
        } else {
          // Send back to draft with reason
          await db.observatoryReport.update({
            where: { id: report.id },
            data: {
              status: 'draft',
              editorialScore,
              editorialReason: String(parsed.reason || 'Below editorial threshold').slice(0, 500),
            },
          })

          rejected++
          results.push({
            reportId: report.id,
            title: report.title,
            editorialScore,
            action: 'draft',
            reason: String(parsed.reason || '').slice(0, 200),
          })
        }
      } catch (err) {
        console.error(`[observatory/publish] Evaluation failed for report ${report.id}:`, err)

        // Fall back to simple scoring based on word count
        const fallbackScore = Math.min(1, report.wordCount / 1500)
        const isApproved = fallbackScore > 0.7

        if (isApproved) {
          await db.observatoryReport.update({
            where: { id: report.id },
            data: {
              status: 'published',
              editorialScore: fallbackScore,
              editorialReason: 'Auto-published based on word count threshold',
              publishedAt: new Date(),
            },
          })

          await db.observatoryPublication.create({
            data: {
              reportId: report.id,
              channel: 'website',
              status: 'published',
              publishedUrl: `/research/${report.slug}`,
              publishedAt: new Date(),
              reachEstimate: 5000,
            },
          })

          published++
        } else {
          await db.observatoryReport.update({
            where: { id: report.id },
            data: {
              status: 'draft',
              editorialScore: fallbackScore,
              editorialReason: 'Auto-rejected: content too short for publication',
            },
          })

          rejected++
        }

        results.push({
          reportId: report.id,
          title: report.title,
          editorialScore: fallbackScore,
          action: isApproved ? 'published' : 'draft',
          reason: 'Fallback evaluation (LLM unavailable)',
        })
      }
    }

    return NextResponse.json({
      evaluated: proposedReports.length,
      published,
      rejected,
      results,
    })
  } catch (error) {
    console.error('[observatory/publish] POST error:', error)
    return NextResponse.json(
      { error: 'Publishing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/observatory/publish
 * List publications.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
    const channel = url.searchParams.get('channel')
    const status = url.searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (channel) where.channel = channel
    if (status) where.status = status

    const publications = await db.observatoryPublication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        report: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            editorialScore: true,
          },
        },
      },
    })

    const total = await db.observatoryPublication.count({ where })

    return NextResponse.json({ publications, total })
  } catch (error) {
    console.error('[observatory/publish] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch publications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
