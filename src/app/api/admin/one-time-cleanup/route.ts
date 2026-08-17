/**
 * One-time cleanup endpoint — NO CRON_SECRET REQUIRED
 * This endpoint deletes all old AI-generated blog content.
 * After running, DELETE this file and redeploy.
 *
 * Security: requires ?key=seosights-cleanup-2025 query param
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  if (key !== 'seosights-cleanup-2025') {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  try {
    // Delete all AI-generated blog content
    const { count: deletedArticles } = await db.contentArticle.deleteMany({
      where: { domain: 'seosights.com' },
    })

    // Delete all queue entries
    const { count: deletedQueue } = await db.internalContentQueue.deleteMany({})

    // Delete all publish logs
    const { count: deletedLogs } = await db.cMSPublishLog.deleteMany({})

    // Delete orphans
    const { count: deletedReviews } = await db.contentReview.deleteMany({})
    const { count: deletedBriefs } = await db.contentBrief.deleteMany({})

    const result = {
      success: true,
      deletedArticles,
      deletedQueue,
      deletedLogs,
      deletedReviews,
      deletedBriefs,
      message: `Cleanup complete: ${deletedArticles} articles, ${deletedQueue} queue entries, ${deletedLogs} publish logs, ${deletedBriefs} briefs, ${deletedReviews} reviews deleted`,
    }

    console.log('[One-Time-Cleanup]', result.message)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[One-Time-Cleanup] Error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
