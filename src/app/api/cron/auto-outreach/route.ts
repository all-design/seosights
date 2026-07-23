/**
 * Cron API — Weekly Auto-Outreach (Production)
 *
 * POST /api/cron/auto-outreach
 *
 * Finds pending outreach logs and sends emails using the
 * email utility (@/lib/email) which supports:
 * - Resend (primary, if RESEND_API_KEY is set)
 * - SendGrid (alternative, if SENDGRID_API_KEY is set)
 * - Simulated fallback (dev/sandbox mode)
 *
 * Flow:
 * 1. Link Strategist generates link prospect directory
 * 2. Backlink Prospector generates personalized outreach emails
 * 3. This cron sends the emails and logs results
 *
 * Sender: agents@seosights.com
 * Target: 10-20 sites/week
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, formatOutreachEmail, isEmailConfigured } from '@/lib/email'

interface AutoOutreachBody {
  projectId?: string
}

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

// ── GET: Vercel Cron Jobs support (delegates to POST) ──────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }
  // Pass auth headers through to POST delegate
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const authHeader = request.headers.get('authorization')
  if (authHeader) headers.set('authorization', authHeader)
  const cronHeader = request.headers.get('x-cron-secret')
  if (cronHeader) headers.set('x-cron-secret', cronHeader)
  const vercelCronHeader = request.headers.get('x-vercel-cron-secret')
  if (vercelCronHeader) headers.set('x-vercel-cron-secret', vercelCronHeader)
  return POST(new NextRequest('https://localhost/api/cron/auto-outreach', {
    method: 'POST',
    body: JSON.stringify({}),
    headers,
  }))
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }
  try {
    const body = (await request.json()) as AutoOutreachBody

    // Find all pending outreach logs
    const whereClause: Record<string, unknown> = {
      status: 'pending',
    }

    if (body.projectId) {
      whereClause.projectId = body.projectId
    } else {
      whereClause.project = { isInternalAutopilot: true }
    }

    const pendingOutreach = await db.outreachLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      take: 20, // Max 20 per run (10-20 sites/week target)
      include: {
        project: {
          select: {
            id: true,
            domain: true,
            url: true,
          },
        },
      },
    })

    if (pendingOutreach.length === 0) {
      return NextResponse.json({
        message: 'No pending outreach emails to send',
        sent: 0,
        failed: 0,
      })
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []
    let lastProvider: string | null = null

    for (const outreach of pendingOutreach as any[]) {
      try {
        // ── Send Email ───────────────────────────────────────────────
        const emailResult = await sendEmail({
          to: outreach.targetEmail,
          subject: outreach.subject,
          html: formatOutreachEmail(outreach.emailBody || outreach.body || ''),
          replyTo: 'outreach@seosights.com',
          headers: {
            'X-Entity-Ref-ID': `seosights-outreach-${outreach.id}`,
          },
        })

        lastProvider = emailResult.provider

        if (emailResult.success) {
          await db.outreachLog.update({
            where: { id: outreach.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
            },
          })
          sent++
          console.log(
            `[Auto-Outreach] ✉️ Sent to ${outreach.targetEmail} at ${outreach.targetSite} — "${outreach.subject}" (via ${emailResult.provider})`
          )
        } else {
          await db.outreachLog.update({
            where: { id: outreach.id },
            data: {
              status: 'failed',
              error: emailResult.error || 'Email delivery failed',
            } as any,
          })
          failed++
          errors.push(
            `${outreach.targetSite} (${outreach.targetEmail}): ${emailResult.error}`
          )
        }
      } catch (updateError) {
        const errorMessage =
          updateError instanceof Error ? updateError.message : 'Unknown error'

        await db.outreachLog.update({
          where: { id: outreach.id },
          data: {
            status: 'failed',
            error: errorMessage,
          } as any,
        })
        failed++
        errors.push(`${(outreach as any).targetSite || 'unknown'}: ${errorMessage}`)
      }
    }

    console.log(
      `[Auto-Outreach] Run complete: ${sent} sent, ${failed} failed out of ${pendingOutreach.length} pending`
    )

    const emailConfigured = isEmailConfigured()

    return NextResponse.json({
      message: 'Auto-outreach run complete',
      total: pendingOutreach.length,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      note: `Email delivery via ${emailConfigured ? 'Resend/SendGrid' : 'simulation (no API key configured)'}. Add RESEND_API_KEY or SENDGRID_API_KEY env var for production email delivery.`,
      provider: lastProvider,
    })
  } catch (error) {
    console.error('[Cron Auto-Outreach API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to run auto-outreach' },
      { status: 500 }
    )
  }
}
