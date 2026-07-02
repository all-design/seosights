/**
 * Email Digest Template — "What changed overnight?"
 *
 * Generates a beautiful HTML email summarizing AI visibility changes
 * for a user's domain. Used by the /api/ai/digest and /api/cron/digest endpoints.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface DigestData {
  domain: string
  digestType: 'overnight' | 'weekly' | 'monthly'
  scoreBefore: number
  scoreAfter: number
  scoreDelta: number
  citationsGained: number
  citationsLost: number
  newOpportunities: number
  topOpportunity?: {
    title: string
    description: string
    estimatedScoreGain: number
    roiScore: number
    effortMinutes: number
  } | null
  engineChanges?: Record<
    string,
    {
      scoreBefore: number
      scoreAfter: number
      delta: number
      citationsGained: number
      citationsLost: number
    }
  > | null
  feedHighlights?: Array<{
    title: string
    description: string
    severity: string
    iconEmoji: string
    createdAt: string
  }>
}

// ── Engine Icons & Colors ──────────────────────────────────────────────────

const ENGINE_META: Record<string, { name: string; color: string; icon: string }> = {
  chatgpt: { name: 'ChatGPT', color: '#10a37f', icon: '🤖' },
  claude: { name: 'Claude', color: '#d4a574', icon: '🟤' },
  gemini: { name: 'Gemini', color: '#4285f4', icon: '💎' },
  perplexity: { name: 'Perplexity', color: '#20b8cd', icon: '🔮' },
  copilot: { name: 'Copilot', color: '#6264a7', icon: '🛩️' },
}

// ── Helper: Score color ────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return '#10b981' // emerald
  if (score >= 55) return '#f59e0b' // amber
  if (score >= 35) return '#f97316' // orange
  return '#ef4444' // red
}

function deltaBadge(delta: number): string {
  if (delta > 0) return `<span style="color:#10b981;font-weight:700;">+${delta}</span>`
  if (delta < 0) return `<span style="color:#ef4444;font-weight:700;">${delta}</span>`
  return `<span style="color:#6b7280;font-weight:700;">0</span>`
}

function verdictLabel(score: number): string {
  if (score >= 75) return 'Dominant'
  if (score >= 55) return 'Competitive'
  if (score >= 35) return 'Emerging'
  return 'Invisible'
}

// ── Main Template ──────────────────────────────────────────────────────────

export function generateDigestEmail(data: DigestData): string {
  const {
    domain,
    digestType,
    scoreBefore,
    scoreAfter,
    scoreDelta,
    citationsGained,
    citationsLost,
    newOpportunities,
    topOpportunity,
    engineChanges,
    feedHighlights,
  } = data

  const periodLabel =
    digestType === 'overnight'
      ? 'overnight'
      : digestType === 'weekly'
        ? 'this week'
        : 'this month'

  const subject = `🌙 What changed ${periodLabel} — ${domain} AI Visibility`

  // ── Header ────────────────────────────────────────────────────────────
  const header = `
  <tr>
    <td style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); padding: 40px 32px; text-align: center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align: center;">
            <h1 style="margin: 0 0 4px; font-size: 28px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">
              Seosights
            </h1>
            <p style="margin: 0 0 16px; font-size: 14px; color: rgba(255,255,255,0.85); font-weight: 400;">
              AI Visibility Intelligence
            </p>
            <h2 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 700;">
              🌙 What changed ${periodLabel}?
            </h2>
            <p style="margin: 8px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">
              ${domain}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`

  // ── Score Change Section ──────────────────────────────────────────────
  const scoreSection = `
  <tr>
    <td style="padding: 32px;">
      <h3 style="margin: 0 0 20px; font-size: 18px; color: #111827; font-weight: 700;">
        AI Visibility Score
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="33%" style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 12px;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Before</p>
            <p style="margin: 0; font-size: 32px; font-weight: 800; color: ${scoreColor(scoreBefore)};">${scoreBefore}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #9ca3af;">${verdictLabel(scoreBefore)}</p>
          </td>
          <td width="34%" style="text-align: center; padding: 16px 8px;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Change</p>
            <p style="margin: 0; font-size: 32px; font-weight: 800;">${deltaBadge(scoreDelta)}</p>
            <p style="margin: 4px 0 0; font-size: 18px; color: #6b7280;">→</p>
          </td>
          <td width="33%" style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 12px;">
            <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">After</p>
            <p style="margin: 0; font-size: 32px; font-weight: 800; color: ${scoreColor(scoreAfter)};">${scoreAfter}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #9ca3af;">${verdictLabel(scoreAfter)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`

  // ── Citations Section ─────────────────────────────────────────────────
  const citationsSection = `
  <tr>
    <td style="padding: 0 32px 32px;">
      <h3 style="margin: 0 0 16px; font-size: 18px; color: #111827; font-weight: 700;">
        📊 Citation Activity
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="50%" style="padding: 16px; background: #ecfdf5; border-radius: 12px; border: 1px solid #d1fae5;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #065f46; font-weight: 600;">Citations Gained</p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #059669;">+${citationsGained}</p>
          </td>
          <td width="4%"></td>
          <td width="50%" style="padding: 16px; background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #991b1b; font-weight: 600;">Citations Lost</p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #dc2626;">-${citationsLost}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`

  // ── Per-Engine Breakdown ──────────────────────────────────────────────
  let engineSection = ''
  if (engineChanges && Object.keys(engineChanges).length > 0) {
    const engineRows = Object.entries(engineChanges)
      .map(([engine, change]) => {
        const meta = ENGINE_META[engine] || { name: engine, color: '#6b7280', icon: '🔍' }
        return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151;">
            ${meta.icon} <strong>${meta.name}</strong>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; font-size: 14px; color: #6b7280;">
            ${change.scoreBefore}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; font-size: 14px; font-weight: 700;">
            ${change.scoreAfter}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; font-size: 14px; font-weight: 700;">
            ${deltaBadge(change.delta)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; font-size: 14px; color: #059669;">
            +${change.citationsGained}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: center; font-size: 14px; color: #dc2626;">
            -${change.citationsLost}
          </td>
        </tr>`
      })
      .join('')

    engineSection = `
  <tr>
    <td style="padding: 0 32px 32px;">
      <h3 style="margin: 0 0 16px; font-size: 18px; color: #111827; font-weight: 700;">
        🤖 Per-Engine Breakdown
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
        <tr style="background: #f9fafb;">
          <td style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Engine</td>
          <td style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; text-align: center;">Before</td>
          <td style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; text-align: center;">After</td>
          <td style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; text-align: center;">Delta</td>
          <td style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; text-align: center;">Gained</td>
          <td style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; text-align: center;">Lost</td>
        </tr>
        ${engineRows}
      </table>
    </td>
  </tr>`
  }

  // ── Top Opportunities Section ─────────────────────────────────────────
  let opportunitySection = ''
  if (topOpportunity || newOpportunities > 0) {
    const topCard = topOpportunity
      ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
        <tr>
          <td style="padding: 20px; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-radius: 12px; border: 1px solid #a7f3d0;">
            <p style="margin: 0 0 6px; font-size: 11px; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">
              🏆 #1 ROI Opportunity
            </p>
            <p style="margin: 0 0 8px; font-size: 16px; color: #065f46; font-weight: 700;">
              ${topOpportunity.title}
            </p>
            <p style="margin: 0 0 12px; font-size: 14px; color: #047857; line-height: 1.5;">
              ${topOpportunity.description}
            </p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding: 4px 12px 4px 0; font-size: 13px; color: #065f46;">
                  📈 Est. Score Gain: <strong>+${topOpportunity.estimatedScoreGain}</strong>
                </td>
                <td style="padding: 4px 12px; font-size: 13px; color: #065f46;">
                  ⏱ Effort: <strong>${topOpportunity.effortMinutes}min</strong>
                </td>
                <td style="padding: 4px 12px; font-size: 13px; color: #065f46;">
                  💰 ROI Score: <strong>${topOpportunity.roiScore.toFixed(1)}</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
      : ''

    opportunitySection = `
  <tr>
    <td style="padding: 0 32px 32px;">
      <h3 style="margin: 0 0 8px; font-size: 18px; color: #111827; font-weight: 700;">
        🚀 New Opportunities
      </h3>
      <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
        ${newOpportunities} new action item${newOpportunities !== 1 ? 's' : ''} available in your ROI Opportunity Queue
      </p>
      ${topCard}
    </td>
  </tr>`
  }

  // ── Feed Highlights Section ───────────────────────────────────────────
  let feedSection = ''
  if (feedHighlights && feedHighlights.length > 0) {
    const feedCards = feedHighlights
      .slice(0, 5)
      .map((item) => {
        const severityColor =
          item.severity === 'positive'
            ? '#059669'
            : item.severity === 'warning'
              ? '#f59e0b'
              : item.severity === 'critical'
                ? '#dc2626'
                : '#6b7280'

        const bg =
          item.severity === 'positive'
            ? '#f0fdf4'
            : item.severity === 'warning'
              ? '#fffbeb'
              : item.severity === 'critical'
                ? '#fef2f2'
                : '#f9fafb'

        return `
        <tr>
          <td style="padding: 12px 16px; background: ${bg}; border-radius: 8px; border-left: 3px solid ${severityColor}; margin-bottom: 8px;">
            <p style="margin: 0 0 2px; font-size: 14px; color: #111827; font-weight: 600;">
              ${item.iconEmoji} ${item.title}
            </p>
            <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.4;">
              ${item.description}
            </p>
          </td>
        </tr>
        <tr><td style="height: 8px;"></td></tr>`
      })
      .join('')

    feedSection = `
  <tr>
    <td style="padding: 0 32px 32px;">
      <h3 style="margin: 0 0 16px; font-size: 18px; color: #111827; font-weight: 700;">
        📰 Key Events
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${feedCards}
      </table>
    </td>
  </tr>`
  }

  // ── CTA Button ────────────────────────────────────────────────────────
  const ctaSection = `
  <tr>
    <td style="padding: 0 32px 32px; text-align: center;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
        <tr>
          <td style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 12px; padding: 16px 40px;">
            <a href="https://seosights.com/dashboard?domain=${encodeURIComponent(domain)}" style="font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 700; letter-spacing: 0.3px;">
              View Full Dashboard →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`

  // ── Footer ────────────────────────────────────────────────────────────
  const footer = `
  <tr>
    <td style="padding: 24px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-align: center;">
        <strong>Seosights</strong> — AI Visibility Intelligence Platform
      </p>
      <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; text-align: center;">
        You're receiving this because you have active monitoring for <strong>${domain}</strong>
      </p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
        <a href="https://seosights.com/settings/notifications" style="color: #6b7280; text-decoration: underline;">Notification preferences</a>
        &nbsp;·&nbsp;
        <a href="https://seosights.com/unsubscribe?domain=${encodeURIComponent(domain)}&type=${digestType}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
      </p>
    </td>
  </tr>`

  // ── Assemble ──────────────────────────────────────────────────────────
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 24px 16px;">
        <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${header}
          ${scoreSection}
          ${citationsSection}
          ${engineSection}
          ${opportunitySection}
          ${feedSection}
          ${ctaSection}
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

/**
 * Generate the email subject line for a digest
 */
export function generateDigestSubject(
  domain: string,
  digestType: 'overnight' | 'weekly' | 'monthly',
  scoreDelta: number
): string {
  const periodLabel =
    digestType === 'overnight'
      ? 'overnight'
      : digestType === 'weekly'
        ? 'this week'
        : 'this month'

  if (scoreDelta > 0) {
    return `🌙 AI Visibility +${scoreDelta} ${periodLabel} — ${domain}`
  }
  if (scoreDelta < -5) {
    return `⚠️ AI Visibility dropped ${scoreDelta} ${periodLabel} — ${domain}`
  }
  return `🌙 What changed ${periodLabel} — ${domain} AI Visibility`
}
