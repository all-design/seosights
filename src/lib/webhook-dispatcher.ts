/**
 * WebhookDispatcher — Sends formatted webhook payloads to Slack, Discord, or custom endpoints.
 * All dispatching is async and non-blocking. Failures are logged but never throw.
 */

export interface WebhookEvent {
  type: 'analysis.complete' | 'analysis.failed' | 'alert.critical' | 'alert.warning' | 'approval.pending' | 'report.ready'
  domain: string
  message: string
  data?: Record<string, unknown>
}

interface WebhookConfig {
  id: string
  userId: string
  type: string // 'slack' | 'discord' | 'custom'
  url: string
  events: string[] // parsed from JSON
  isActive: boolean
}

// Color coding for event types
const EVENT_COLORS: Record<string, number> = {
  'analysis.complete': 0x10b981, // emerald
  'analysis.failed': 0xef4444,   // red
  'alert.critical': 0xef4444,    // red
  'alert.warning': 0xf59e0b,     // amber
  'approval.pending': 0xf59e0b,  // amber
  'report.ready': 0x10b981,      // emerald
}

const EVENT_COLORS_HEX: Record<string, string> = {
  'analysis.complete': '#10b981',
  'analysis.failed': '#ef4444',
  'alert.critical': '#ef4444',
  'alert.warning': '#f59e0b',
  'approval.pending': '#f59e0b',
  'report.ready': '#10b981',
}

const EVENT_EMOJIS: Record<string, string> = {
  'analysis.complete': '✅',
  'analysis.failed': '❌',
  'alert.critical': '🚨',
  'alert.warning': '⚠️',
  'approval.pending': '🔔',
  'report.ready': '📊',
}

class WebhookDispatcher {
  /**
   * Dispatch an event to all matching webhooks for a user.
   * Non-blocking: catches and logs all errors.
   */
  async dispatch(userId: string, event: WebhookEvent): Promise<void> {
    try {
      // Dynamically import db to avoid circular deps
      const { db } = await import('@/lib/db')

      const webhooks = await db.webhookConfig.findMany({
        where: {
          userId,
          isActive: true,
        },
      })

      // Filter webhooks that listen for this event type
      const matchingWebhooks = webhooks.filter((w) => {
        try {
          const events: string[] = JSON.parse(w.events)
          return events.includes(event.type)
        } catch {
          return false
        }
      })

      if (matchingWebhooks.length === 0) return

      // Send to all matching webhooks in parallel
      const results = await Promise.allSettled(
        matchingWebhooks.map((w) => this.sendWebhook(w, event))
      )

      // Log failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(
            `[webhook-dispatcher] Failed to send to ${matchingWebhooks[index].type} webhook ${matchingWebhooks[index].id}:`,
            result.reason
          )
        }
      })

      // Update lastTriggeredAt for successfully triggered webhooks
      const successfulIds = results
        .map((result, index) => ({
          id: matchingWebhooks[index].id,
          success: result.status === 'fulfilled' && result.value,
        }))
        .filter((r) => r.success)
        .map((r) => r.id)

      if (successfulIds.length > 0) {
        try {
          await db.webhookConfig.updateMany({
            where: { id: { in: successfulIds } },
            data: { lastTriggeredAt: new Date() },
          })
        } catch {
          // Non-critical
        }
      }
    } catch (error) {
      console.error(
        '[webhook-dispatcher] Dispatch error:',
        error instanceof Error ? error.message : 'Unknown'
      )
    }
  }

  /**
   * Format payload for Slack (using blocks API).
   */
  formatSlackPayload(event: WebhookEvent): object {
    const color = EVENT_COLORS_HEX[event.type] || '#6b7280'
    const emoji = EVENT_EMOJIS[event.type] || '📢'
    const eventLabel = event.type
      .split('.')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} seosights — ${eventLabel}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: event.message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `🌐 *Domain:* ${event.domain}  |  🕐 *Time:* ${new Date().toISOString()}`,
            },
          ],
        },
        // Extra data fields if present
        ...(event.data
          ? Object.entries(event.data)
              .slice(0, 5)
              .map(([key, value]) => ({
                type: 'section' as const,
                text: {
                  type: 'mrkdwn' as const,
                  text: `*${key}:* ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`,
                },
              }))
          : []),
        {
          type: 'divider',
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: ' Powered by *seosights* — AI-Powered SEO, AEO & GEO Platform',
            },
          ],
        },
      ],
      attachments: [
        {
          color,
          blocks: [],
        },
      ],
    }
  }

  /**
   * Format payload for Discord (using embeds).
   */
  formatDiscordPayload(event: WebhookEvent): object {
    const color = EVENT_COLORS[event.type] || 0x6b7280
    const emoji = EVENT_EMOJIS[event.type] || '📢'
    const eventLabel = event.type
      .split('.')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    // Build fields from event data
    const fields: { name: string; value: string; inline: boolean }[] = [
      {
        name: 'Domain',
        value: event.domain,
        inline: true,
      },
      {
        name: 'Event',
        value: eventLabel,
        inline: true,
      },
    ]

    if (event.data) {
      Object.entries(event.data)
        .slice(0, 4)
        .forEach(([key, value]) => {
          fields.push({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            inline: true,
          })
        })
    }

    return {
      embeds: [
        {
          title: `${emoji} seosights — ${eventLabel}`,
          description: event.message,
          color,
          fields,
          footer: {
            text: 'Powered by seosights — AI-Powered SEO, AEO & GEO Platform',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    }
  }

  /**
   * Format generic JSON payload.
   */
  formatCustomPayload(event: WebhookEvent): object {
    return {
      source: 'seosights',
      event: event.type,
      domain: event.domain,
      message: event.message,
      data: event.data || {},
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Send the HTTP request to a webhook URL.
   * Returns true on success, false on failure.
   */
  private async sendWebhook(config: WebhookConfig, event: WebhookEvent): Promise<boolean> {
    try {
      let payload: object

      switch (config.type) {
        case 'slack':
          payload = this.formatSlackPayload(event)
          break
        case 'discord':
          payload = this.formatDiscordPayload(event)
          break
        case 'custom':
        default:
          payload = this.formatCustomPayload(event)
          break
      }

      const response = await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10s timeout
      })

      if (!response.ok) {
        console.warn(
          `[webhook-dispatcher] ${config.type} webhook returned ${response.status} for ${config.id}`
        )
        return false
      }

      return true
    } catch (error) {
      console.error(
        `[webhook-dispatcher] Failed to send ${config.type} webhook ${config.id}:`,
        error instanceof Error ? error.message : 'Unknown'
      )
      return false
    }
  }

  /**
   * Test a single webhook by sending a sample payload.
   * Returns { success: boolean, status?: number, error?: string }
   */
  async testWebhook(config: WebhookConfig): Promise<{ success: boolean; status?: number; error?: string }> {
    try {
      const sampleEvent: WebhookEvent = {
        type: 'analysis.complete',
        domain: 'example.com',
        message: '🔍 Test webhook from seosights — Your integration is working!',
        data: {
          seoScore: 72,
          aeoScore: 55,
          geoScore: 48,
        },
      }

      let payload: object
      switch (config.type) {
        case 'slack':
          payload = this.formatSlackPayload(sampleEvent)
          break
        case 'discord':
          payload = this.formatDiscordPayload(sampleEvent)
          break
        case 'custom':
        default:
          payload = this.formatCustomPayload(sampleEvent)
          break
      }

      const response = await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return { success: true, status: response.status }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Singleton export
export const webhookDispatcher = new WebhookDispatcher()
