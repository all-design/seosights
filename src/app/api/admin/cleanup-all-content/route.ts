/**
 * Admin API — Aggressive Cleanup of ALL Content
 *
 * GET/POST /api/admin/cleanup-all-content
 *
 * Deletes:
 * 1. ALL ContentArticle records (regardless of domain)
 * 2. ALL InternalContentQueue records for autopilot projects
 * 3. ALL CMSPublishLog records for those articles
 * 4. ALL ContentBrief records (orphans)
 * 5. ALL ContentReview records (orphans)
 *
 * This is a more aggressive version of cleanup-blog that wipes
 * the entire content pipeline clean.
 *
 * Authorization: CRON_SECRET env variable (Bearer token, x-cron-secret, or x-vercel-cron-secret header)
 * If no CRON_SECRET is set, requests are allowed (dev/sandbox mode).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Authorization ──────────────────────────────────────────────────
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

// ── Core aggressive cleanup logic ──────────────────────────────────
async function runCleanupAll() {
  // Step 1: Find all ContentArticle records (regardless of domain)
  const allArticles = await db.contentArticle.findMany({
    select: { id: true },
  })
  const articleIds = allArticles.map((a) => a.id)

  // Step 2: Find all projects with isInternalAutopilot = true
  const autopilotProjects = await db.project.findMany({
    where: { isInternalAutopilot: true },
    select: { id: true },
  })
  const autopilotProjectIds = autopilotProjects.map((p) => p.id)

  // Step 3: Delete CMSPublishLog records for all articles
  const { count: deletedPublishLogs } = await db.cMSPublishLog.deleteMany({
    where: {
      articleId: { in: articleIds },
    },
  })

  // Step 4: Delete ALL ContentReview records (orphans)
  const { count: deletedReviews } = await db.contentReview.deleteMany({})

  // Step 5: Delete ALL ContentArticle records (regardless of domain)
  // (Must happen after reviews due to FK constraints, though cascade should handle it)
  const { count: deletedArticles } = await db.contentArticle.deleteMany({})

  // Step 6: Delete ALL ContentBrief records (orphans — articles are gone)
  const { count: deletedBriefs } = await db.contentBrief.deleteMany({})

  // Step 7: Delete InternalContentQueue records for autopilot projects
  const { count: deletedQueueEntries } = await db.internalContentQueue.deleteMany({
    where: {
      projectId: { in: autopilotProjectIds },
    },
  })

  const message =
    `Aggressive cleanup complete: deleted ${deletedArticles} article(s), ` +
    `${deletedBriefs} brief(s), ${deletedReviews} review(s), ` +
    `${deletedQueueEntries} queue entr(y/ies), ${deletedPublishLogs} publish log(s)`

  console.log(`[Cleanup-All-Content] ${message}`)

  return {
    deletedArticles,
    deletedQueueEntries,
    deletedPublishLogs,
    deletedBriefs,
    deletedReviews,
    message,
  }
}

// ── GET handler ────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }

  try {
    const result = await runCleanupAll()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Cleanup-All-Content API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to run aggressive content cleanup' },
      { status: 500 },
    )
  }
}

// ── POST handler ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }

  try {
    const result = await runCleanupAll()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Cleanup-All-Content API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to run aggressive content cleanup' },
      { status: 500 },
    )
  }
}
