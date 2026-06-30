import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const domain = 'seosights.com'
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: Record<string, unknown> = { domain }
    if (unreadOnly) {
      where.isUnread = true
    }

    const items = await db.engagementInboxItem.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[engagement/inbox] Error:', error)
    return NextResponse.json({ error: 'Failed to load inbox' }, { status: 500 })
  }
}
