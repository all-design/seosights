import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// PUT /api/webhooks/[id] — Update a webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { url, events, isActive } = body

    // Check if webhook exists
    const existing = await db.webhookConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Validate URL if provided
    if (url !== undefined) {
      try {
        const parsedUrl = new URL(url)
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return NextResponse.json(
            { error: 'URL must use http or https protocol' },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }

      // Type-specific URL validation
      if (existing.type === 'slack' && !url.includes('hooks.slack.com')) {
        return NextResponse.json(
          { error: 'Slack webhook URL should be from hooks.slack.com/services/...' },
          { status: 400 }
        )
      }
      if (existing.type === 'discord' && !url.includes('discord.com/api/webhooks')) {
        return NextResponse.json(
          { error: 'Discord webhook URL should be from discord.com/api/webhooks/...' },
          { status: 400 }
        )
      }
    }

    // Validate events if provided
    if (events !== undefined && Array.isArray(events)) {
      const validEvents = [
        'analysis.complete',
        'analysis.failed',
        'alert.critical',
        'alert.warning',
        'approval.pending',
        'report.ready',
      ]
      const invalidEvents = events.filter((e: string) => !validEvents.includes(e))
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid event types: ${invalidEvents.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (url !== undefined) updateData.url = url
    if (events !== undefined) updateData.events = JSON.stringify(events)
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await db.webhookConfig.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      webhook: {
        ...updated,
        events: JSON.parse(updated.events),
      },
    })
  } catch (error) {
    console.error('[webhooks/:id] PUT error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }
}

// DELETE /api/webhooks/[id] — Delete a webhook
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if webhook exists
    const existing = await db.webhookConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    await db.webhookConfig.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[webhooks/:id] DELETE error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }
}
