/**
 * Admin API — Cleanup Blog Content
 *
 * GET/POST /api/admin/cleanup-blog
 *
 * Deletes:
 * 1. ALL ContentArticle records where domain = 'seosights.com'
 * 2. ALL InternalContentQueue records where projectId matches any project with isInternalAutopilot = true
 * 3. ALL CMSPublishLog records for those articles
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

// ── Core cleanup logic ─────────────────────────────────────────────
async function runCleanup() {
  // Step 1: Find all articles with domain = 'seosights.com'
  const seosightsArticles = await db.contentArticle.findMany({
    where: { domain: 'seosights.com' },
    select: { id: true },
  })
  const articleIds = seosightsArticles.map((a) => a.id)

  // Step 2: Find all projects with isInternalAutopilot = true
  const autopilotProjects = await db.project.findMany({
    where: { isInternalAutopilot: true },
    select: { id: true },
  })
  const autopilotProjectIds = autopilotProjects.map((p) => p.id)

  // Step 3: Delete CMSPublishLog records for those articles
  const { count: deletedPublishLogs } = await db.cMSPublishLog.deleteMany({
    where: {
      articleId: { in: articleIds },
    },
  })

  // Step 4: Delete ContentArticle records where domain = 'seosights.com'
  // (Cascade will handle ContentReview and ContentExperimentVariant)
  const { count: deletedArticles } = await db.contentArticle.deleteMany({
    where: { domain: 'seosights.com' },
  })

  // Step 5: Delete InternalContentQueue records for autopilot projects
  const { count: deletedQueueEntries } = await db.internalContentQueue.deleteMany({
    where: {
      projectId: { in: autopilotProjectIds },
    },
  })

  const message = `Cleanup complete: deleted ${deletedArticles} article(s), ${deletedQueueEntries} queue entr(y/ies), ${deletedPublishLogs} publish log(s)`

  console.log(`[Cleanup-Blog] ${message}`)

  return {
    deletedArticles,
    deletedQueueEntries,
    deletedPublishLogs,
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
    const result = await runCleanup()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Cleanup-Blog API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to run blog cleanup' },
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
    const result = await runCleanup()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Cleanup-Blog API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to run blog cleanup' },
      { status: 500 },
    )
  }
}
