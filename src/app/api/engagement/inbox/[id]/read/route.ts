import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const item = await db.engagementInboxItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 })
    }

    if (!item.isUnread) {
      return NextResponse.json({ item })
    }

    const updated = await db.engagementInboxItem.update({
      where: { id },
      data: {
        isUnread: false,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ item: updated })
  } catch (error) {
    console.error('[engagement/inbox/read] Error:', error)
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
  }
}
