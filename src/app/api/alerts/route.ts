import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * AI Visibility Alerts API
 *
 * GET  — Fetch alerts with optional filters (domain, userId, isRead, severity)
 * POST — Create a new alert
 * PUT  — Mark alerts as read
 */

// ── GET: Fetch alerts ──────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const userId = searchParams.get('userId')
    const isRead = searchParams.get('isRead')
    const severity = searchParams.get('severity')

    const where: Record<string, unknown> = {}

    if (domain) where.domain = domain
    if (userId) where.userId = userId
    if (isRead !== null && isRead !== undefined && isRead !== '') {
      where.isRead = isRead === 'true'
    }
    if (severity) where.severity = severity

    const alerts = await db.visibilityAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const unreadCount = await db.visibilityAlert.count({
      where: { ...where, isRead: false },
    })

    return NextResponse.json({ alerts, unreadCount })
  } catch (error) {
    console.error('[alerts] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// ── POST: Create a new alert ───────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, alertType, severity, message, data, userId } = body

    if (!domain || !alertType || !message) {
      return NextResponse.json(
        { error: 'domain, alertType, and message are required' },
        { status: 400 }
      )
    }

    const validAlertTypes = ['citation_drop', 'ai_overview_lost', 'bot_blocked', 'score_change', 'llms_txt_removed']
    if (!validAlertTypes.includes(alertType)) {
      return NextResponse.json(
        { error: `alertType must be one of: ${validAlertTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const validSeverities = ['info', 'warning', 'critical']
    const alertSeverity = validSeverities.includes(severity) ? severity : 'warning'

    // Use provided userId or default
    const alertUserId = userId || 'default-user'

    const alert = await db.visibilityAlert.create({
      data: {
        userId: alertUserId,
        domain,
        alertType,
        severity: alertSeverity,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    })

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('[alerts] POST error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}

// ── PUT: Mark alerts as read ───────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertIds } = body

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return NextResponse.json(
        { error: 'alertIds must be a non-empty array' },
        { status: 400 }
      )
    }

    const result = await db.visibilityAlert.updateMany({
      where: { id: { in: alertIds } },
      data: { isRead: true },
    })

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error('[alerts] PUT error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to update alerts' },
      { status: 500 }
    )
  }
}
