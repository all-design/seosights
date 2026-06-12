/**
 * Email Sending Utility — Production Integration
 *
 * Supports multiple providers:
 * - Resend (primary, recommended for transactional emails) — requires `resend` package
 * - SendGrid (alternative, fetch-based — no SDK needed)
 * - Fallback: Simulated sending for development/sandbox
 *
 * All emails are sent from agents@seosights.com
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface EmailPayload {
  to: string
  from?: string
  subject: string
  html: string
  replyTo?: string
  headers?: Record<string, string>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  provider: 'resend' | 'sendgrid' | 'simulated'
}

// ── Configuration ──────────────────────────────────────────────────────────

const DEFAULT_FROM = 'seosights Agents <agents@seosights.com>'
const DEFAULT_REPLY_TO = 'outreach@seosights.com'

export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY)
}

// ── Primary: Resend ────────────────────────────────────────────────────────

async function sendViaResend(payload: EmailPayload): Promise<EmailResult> {
  try {
    // Dynamic import so the app doesn't crash if `resend` is not installed
    const resendModule = await import('resend')
    const Resend = resendModule.Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: payload.from || DEFAULT_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      replyTo: payload.replyTo || DEFAULT_REPLY_TO,
      headers: payload.headers,
    })

    if (error) {
      return { success: false, error: error.message, provider: 'resend' }
    }

    return { success: true, messageId: data?.id, provider: 'resend' }
  } catch (error) {
    // If `resend` package is not installed, fall through to next provider
    const message =
      error instanceof Error ? error.message : 'Resend send failed'
    console.warn(`[email] Resend failed: ${message}`)
    return {
      success: false,
      error: message,
      provider: 'resend',
    }
  }
}

// ── Alternative: SendGrid ──────────────────────────────────────────────────

async function sendViaSendGrid(payload: EmailPayload): Promise<EmailResult> {
  try {
    // Using fetch-based SendGrid API (no SDK needed)
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: {
          email: (payload.from || DEFAULT_FROM).replace(/.*<(.*)>.*/, '$1'),
          name: 'seosights Agents',
        },
        reply_to: { email: payload.replyTo || DEFAULT_REPLY_TO },
        subject: payload.subject,
        content: [{ type: 'text/html', value: payload.html }],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return {
        success: false,
        error: `SendGrid ${response.status}: ${errorBody}`,
        provider: 'sendgrid',
      }
    }

    return {
      success: true,
      messageId: response.headers.get('X-Message-Id') || undefined,
      provider: 'sendgrid',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SendGrid send failed',
      provider: 'sendgrid',
    }
  }
}

// ── Fallback: Simulated ────────────────────────────────────────────────────

function sendSimulated(payload: EmailPayload): EmailResult {
  // Simulate 95% success rate for development
  const success = Math.random() > 0.05
  console.log(
    `[email] Simulated send to: ${payload.to} | Subject: "${payload.subject}" | Success: ${success}`
  )
  return {
    success,
    messageId: success
      ? `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      : undefined,
    error: success ? undefined : 'Simulated delivery failure',
    provider: 'simulated',
  }
}

// ── Main Export ────────────────────────────────────────────────────────────

/**
 * Send an email using the configured provider.
 * Falls back to simulated sending if no provider is configured.
 *
 * Provider priority:
 * 1. Resend (if RESEND_API_KEY is set and `resend` package is available)
 * 2. SendGrid (if SENDGRID_API_KEY is set)
 * 3. Simulated (dev/sandbox mode)
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  // Primary: Resend
  if (process.env.RESEND_API_KEY) {
    const result = await sendViaResend(payload)
    // Only return if the package was actually available (not a module-not-found error)
    if (result.success || !result.error?.includes('Cannot find module')) {
      return result
    }
    // Package not installed — fall through to next provider
    console.warn(
      '[email] Resend API key found but `resend` package not installed, falling back'
    )
  }

  // Alternative: SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return sendViaSendGrid(payload)
  }

  // Fallback: Simulated (dev/sandbox mode)
  return sendSimulated(payload)
}

/**
 * Format an outreach email body into professional HTML
 */
export function formatOutreachEmail(bodyText: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="border-top: 3px solid #10b981; padding-top: 20px;">
        ${bodyText.replace(/\n/g, '<br>')}
        <br><br>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #6b7280;">
          This email was sent by the seosights AI Outreach System on behalf of our link building agents.
          If you'd like to stop receiving these emails, please reply with "UNSUBSCRIBE".
        </p>
      </div>
    </div>
  `.trim()
}
