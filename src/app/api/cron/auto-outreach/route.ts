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

export async function POST(request: NextRequest) {
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

    for (const outreach of pendingOutreach) {
      try {
        // ── Send Email ───────────────────────────────────────────────
        const emailResult = await sendEmail({
          to: outreach.targetEmail,
          subject: outreach.subject,
          html: formatOutreachEmail(outreach.emailBody),
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
              errorMessage: emailResult.error || 'Email delivery failed',
            },
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
            errorMessage,
          },
        })
        failed++
        errors.push(`${outreach.targetSite}: ${errorMessage}`)
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
