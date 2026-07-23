/**
 * Cron API — Auto-Promotion of Pending Reports & Articles
 *
 * GET /api/cron/promote-reports
 *
 * Schedule: Every hour (0 * * * *)
 * Purpose: Promotes ObservatoryReport records stuck in 'proposed' status
 *          and ContentArticle records stuck in 'draft'/'review' status
 *          to 'published', so they become visible on the public site.
 *
 * Criteria:
 * - ObservatoryReport: status='proposed' AND created more than 1 hour ago
 *   → promoted to status='published' with editorialScore=80
 * - ContentArticle: status='draft' or 'review' AND created more than 1 hour ago
 *   → promoted to status='published'
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // No secret → dev/sandbox mode

  const authHeader = request.headers.get('authorization') || ''
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch && bearerMatch[1] === secret) return true

  const xHeader = request.headers.get('x-cron-secret')
  if (xHeader && xHeader === secret) return true

  // Vercel Cron Jobs send this header automatically
  const vercelHeader = request.headers.get('x-vercel-cron-secret')
  if (vercelHeader && vercelHeader === secret) return true

  return false
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }

  const pipelineStart = Date.now()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  let promotedReports = 0
  let promotedArticles = 0
  const errors: string[] = []

  // ─── Step 1: Promote ObservatoryReport 'proposed' → 'published' ──────
  try {
    const result = await db.observatoryReport.updateMany({
      where: {
        status: 'proposed',
        createdAt: { lt: oneHourAgo },
      },
      data: {
        status: 'published',
        editorialScore: 80,
        publishedAt: new Date(),
      },
    })

    promotedReports = result.count
    console.log(
      `[cron/promote-reports] Promoted ${promotedReports} ObservatoryReport records from 'proposed' to 'published'`
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    errors.push(`ObservatoryReport promotion failed: ${msg}`)
    console.error('[cron/promote-reports] ObservatoryReport promotion error:', msg)
  }

  // ─── Step 2: Promote ContentArticle 'draft'/'review' → 'published' ──
  try {
    const draftResult = await db.contentArticle.updateMany({
      where: {
        status: 'draft',
        createdAt: { lt: oneHourAgo },
      },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    })

    const reviewResult = await db.contentArticle.updateMany({
      where: {
        status: 'review',
        createdAt: { lt: oneHourAgo },
      },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    })

    promotedArticles = draftResult.count + reviewResult.count
    console.log(
      `[cron/promote-reports] Promoted ${promotedArticles} ContentArticle records from 'draft'/'review' to 'published'`
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    errors.push(`ContentArticle promotion failed: ${msg}`)
    console.error('[cron/promote-reports] ContentArticle promotion error:', msg)
  }

  const totalDurationMs = Date.now() - pipelineStart

  return NextResponse.json({
    success: true,
    pipeline: 'promote-reports',
    schedule: 'Every hour (0 * * * *)',
    timestamp: new Date().toISOString(),
    promoted: {
      observatoryReports: promotedReports,
      contentArticles: promotedArticles,
    },
    errors,
    totalDurationMs,
  })
}
