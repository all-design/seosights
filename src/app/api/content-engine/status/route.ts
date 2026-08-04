import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/content-engine/status
 * Returns Content Engine status, queue stats, and recent article activity.
 */
export async function GET() {
  try {
    const [totalArticles, pendingArticles, publishedArticles, recentArticles] = await Promise.all([
      db.internalContentQueue.count(),
      db.internalContentQueue.count({ where: { status: 'pending' } }),
      db.internalContentQueue.count({ where: { status: 'published' } }),
      db.internalContentQueue.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    ])

    const status = totalArticles > 0 ? 'operational' : 'standby'

    return NextResponse.json({
      status,
      queue: {
        total: totalArticles,
        pending: pendingArticles,
        published: publishedArticles,
      },
      recentArticles: recentArticles.map((a: any) => ({
        id: a.id,
        title: a.title || a.suggestedTitle,
        status: a.status,
        createdAt: a.createdAt,
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[content-engine/status] Error:', error)
    return NextResponse.json({ status: 'error', error: 'Failed to fetch content engine status' }, { status: 500 })
  }
}
