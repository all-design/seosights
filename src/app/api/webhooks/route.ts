import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/webhooks?userId=xxx — Fetch all webhooks for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const webhooks = await db.webhookConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Parse the events JSON string for each webhook
    const parsed = webhooks.map((w) => ({
      ...w,
      events: JSON.parse(w.events),
    }))

    return NextResponse.json({ webhooks: parsed })
  } catch (error) {
    console.error('[webhooks] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
  }
}

// POST /api/webhooks — Create a new webhook config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, url, events } = body

    if (!userId || !type || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, url, events' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['slack', 'discord', 'custom'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: slack, discord, or custom' },
        { status: 400 }
      )
    }

    // Validate URL format
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

    // Type-specific URL validation hints
    if (type === 'slack' && !url.includes('hooks.slack.com')) {
      return NextResponse.json(
        { error: 'Slack webhook URL should be from hooks.slack.com/services/...' },
        { status: 400 }
      )
    }
    if (type === 'discord' && !url.includes('discord.com/api/webhooks')) {
      return NextResponse.json(
        { error: 'Discord webhook URL should be from discord.com/api/webhooks/...' },
        { status: 400 }
      )
    }

    // Validate event types
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

    // Check if user already has too many webhooks (limit: 10)
    const existingCount = await db.webhookConfig.count({
      where: { userId },
    })
    if (existingCount >= 10) {
      return NextResponse.json(
        { error: 'Maximum of 10 webhooks per user reached' },
        { status: 400 }
      )
    }

    const webhook = await db.webhookConfig.create({
      data: {
        userId,
        type,
        url,
        events: JSON.stringify(events),
        isActive: true,
      },
    })

    return NextResponse.json({
      webhook: {
        ...webhook,
        events: JSON.parse(webhook.events),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[webhooks] POST error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}
