import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * AI Visibility Check API
 *
 * POST — Run a visibility check for a domain
 *   - Uses z-ai-web-dev-sdk to search for AI citations
 *   - Checks robots.txt for bot access changes
 *   - Checks for llms.txt presence
 *   - Compares current state with last known state (from previous alerts/analyses)
 *   - Creates alerts if significant changes are detected
 */

// AI bots we track
const AI_BOTS = [
  { bot: 'GPTBot', patterns: ['GPTBot', 'gptbot'] },
  { bot: 'ChatGPT-User', patterns: ['ChatGPT-User', 'chatgpt-user'] },
  { bot: 'ClaudeBot', patterns: ['ClaudeBot', 'claudbot'] },
  { bot: 'PerplexityBot', patterns: ['PerplexityBot', 'perplexity'] },
  { bot: 'Google-Extended', patterns: ['Google-Extended', 'google-extended'] },
  { bot: 'Bytespider', patterns: ['Bytespider', 'bytespider'] },
  { bot: 'FacebookBot', patterns: ['FacebookBot', 'facebookbot'] },
  { bot: 'Applebot-Extended', patterns: ['Applebot-Extended', 'applebot'] },
  { bot: 'CCBot', patterns: ['CCBot', 'ccbot'] },
  { bot: 'cohere-ai', patterns: ['cohere-ai', 'cohere'] },
  { bot: 'Diffbot', patterns: ['Diffbot', 'diffbot'] },
  { bot: 'YouBot', patterns: ['YouBot', 'youbot'] },
]

interface BotStatus {
  bot: string
  blocked: boolean
  detail: string
}

function parseRobotsTxt(robotsTxt: string): BotStatus[] {
  const results: BotStatus[] = []
  for (const aiBot of AI_BOTS) {
    const isBlocked = aiBot.patterns.some(pattern => {
      const botSectionRegex = new RegExp(`User-agent:\\s*${pattern}[\\s\\S]*?(?=User-agent:|$)`, 'gi')
      const botSection = robotsTxt.match(botSectionRegex)
      if (botSection) {
        const hasDisallowAll = botSection.some(section => /Disallow:\s*\/\s*$/im.test(section))
        return hasDisallowAll
      }
      return false
    })
    results.push({
      bot: aiBot.bot,
      blocked: isBlocked,
      detail: isBlocked ? 'Blocked in robots.txt' : 'Access allowed',
    })
  }
  return results
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, userId, currentScores } = body

    if (!domain) {
      return NextResponse.json({ error: 'domain is required' }, { status: 400 })
    }

    const alertUserId = userId || 'default-user'
    const createdAlerts: Record<string, unknown>[] = []

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // ── Step 1: Search for AI citations of the domain ──
    let citationCount = 0
    let citationSources: string[] = []
    try {
      const searchResults = await zai.functions.invoke('web_search', {
        query: `"${domain}" site:perplexity.ai OR site:chat.openai.com OR site:gemini.google.com`,
        num: 10,
      })
      if (searchResults && Array.isArray(searchResults)) {
        citationCount = searchResults.length
        citationSources = searchResults.map((r: { url?: string; name?: string }) => r.url || r.name || '').filter(Boolean)
      }
    } catch {
      // Search may fail, continue with other checks
    }

    // ── Step 2: Fetch robots.txt and check bot access ──
    let currentBotStatus: BotStatus[] = []
    let robotsTxtContent = ''
    try {
      const protocol = domain.startsWith('http') ? '' : 'https://'
      const robotsUrl = `${protocol}${domain}/robots.txt`
      const robotsResult = await zai.functions.invoke('page_reader', { url: robotsUrl })
      if (robotsResult) {
        const rd = robotsResult.data || robotsResult
        robotsTxtContent = (rd.html || rd.text || '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        currentBotStatus = parseRobotsTxt(robotsTxtContent)
      }
    } catch {
      // robots.txt may not exist
    }

    // ── Step 3: Check for llms.txt ──
    let llmsTxtExists = false
    try {
      const protocol = domain.startsWith('http') ? '' : 'https://'
      const llmsUrl = `${protocol}${domain}/llms.txt`
      const llmsResult = await zai.functions.invoke('page_reader', { url: llmsUrl })
      if (llmsResult) {
        const ld = llmsResult.data || llmsResult
        const content = (ld.html || ld.text || '').trim()
        llmsTxtExists = content.length > 10
      }
    } catch {
      llmsTxtExists = false
    }

    // ── Step 4: Get last known state from previous alerts ──
    const previousAlerts = await db.visibilityAlert.findMany({
      where: { domain, alertType: { in: ['bot_blocked', 'citation_drop', 'llms_txt_removed', 'score_change'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Extract last known state
    let lastKnownBotBlocked: string[] = []
    let lastKnownLlmsTxt = true // assume it existed
    let lastKnownCitationCount = 0

    for (const alert of previousAlerts) {
      try {
        const alertData = alert.data ? JSON.parse(alert.data) : {}
        if (alert.alertType === 'bot_blocked' && alertData.blockedBots) {
          lastKnownBotBlocked = alertData.blockedBots as string[]
        }
        if (alert.alertType === 'citation_drop' && typeof alertData.citationCount === 'number') {
          lastKnownCitationCount = alertData.citationCount as number
        }
        if (alert.alertType === 'llms_txt_removed') {
          lastKnownLlmsTxt = false
        }
      } catch {
        // ignore parse errors
      }
    }

    // ── Step 5: Compare and create alerts ──

    // Check 1: Score drop
    if (currentScores) {
      const seoDrop = typeof currentScores.previousSeo === 'number' && typeof currentScores.seo === 'number'
        ? currentScores.previousSeo - currentScores.seo : 0
      const aeoDrop = typeof currentScores.previousAeo === 'number' && typeof currentScores.aeo === 'number'
        ? currentScores.previousAeo - currentScores.aeo : 0
      const geoDrop = typeof currentScores.previousGeo === 'number' && typeof currentScores.geo === 'number'
        ? currentScores.previousGeo - currentScores.geo : 0

      if (seoDrop > 10) {
        const alert = await db.visibilityAlert.create({
          data: {
            userId: alertUserId,
            domain,
            alertType: 'score_change',
            severity: seoDrop > 25 ? 'critical' : 'warning',
            message: `SEO score dropped ${seoDrop} points (from ${currentScores.previousSeo} to ${currentScores.seo}). This may indicate a Google algorithm update, lost backlinks, or technical issues affecting crawlability.`,
            data: JSON.stringify({ pillar: 'seo', previous: currentScores.previousSeo, current: currentScores.seo, drop: seoDrop }),
          },
        })
        createdAlerts.push(alert)
      }

      if (aeoDrop > 10) {
        const alert = await db.visibilityAlert.create({
          data: {
            userId: alertUserId,
            domain,
            alertType: 'score_change',
            severity: aeoDrop > 25 ? 'critical' : 'warning',
            message: `AEO score dropped ${aeoDrop} points (from ${currentScores.previousAeo} to ${currentScores.aeo}). Your content may no longer be selected for featured snippets or AI Overview responses.`,
            data: JSON.stringify({ pillar: 'aeo', previous: currentScores.previousAeo, current: currentScores.aeo, drop: aeoDrop }),
          },
        })
        createdAlerts.push(alert)
      }

      if (geoDrop > 10) {
        const alert = await db.visibilityAlert.create({
          data: {
            userId: alertUserId,
            domain,
            alertType: 'score_change',
            severity: geoDrop > 25 ? 'critical' : 'warning',
            message: `GEO score dropped ${geoDrop} points (from ${currentScores.previousGeo} to ${currentScores.geo}). AI engines like ChatGPT and Perplexity may be citing your site less frequently.`,
            data: JSON.stringify({ pillar: 'geo', previous: currentScores.previousGeo, current: currentScores.geo, drop: geoDrop }),
          },
        })
        createdAlerts.push(alert)
      }
    }

    // Check 2: Bot access changes — newly blocked bots
    const currentlyBlockedBots = currentBotStatus.filter(b => b.blocked).map(b => b.bot)
    const newlyBlockedBots = currentlyBlockedBots.filter(b => !lastKnownBotBlocked.includes(b))

    if (newlyBlockedBots.length > 0) {
      const alert = await db.visibilityAlert.create({
        data: {
          userId: alertUserId,
          domain,
          alertType: 'bot_blocked',
          severity: newlyBlockedBots.length >= 3 ? 'critical' : 'warning',
          message: `${newlyBlockedBots.length} AI bot${newlyBlockedBots.length > 1 ? 's' : ''} newly blocked in robots.txt: ${newlyBlockedBots.join(', ')}. These bots can no longer crawl your site, reducing your AI visibility.`,
          data: JSON.stringify({ blockedBots: currentlyBlockedBots, newlyBlocked: newlyBlockedBots }),
        },
      })
      createdAlerts.push(alert)
    }

    // Check 3: Citation count drop
    if (lastKnownCitationCount > 0 && citationCount < lastKnownCitationCount - 2) {
      const drop = lastKnownCitationCount - citationCount
      const alert = await db.visibilityAlert.create({
        data: {
          userId: alertUserId,
          domain,
          alertType: 'citation_drop',
          severity: drop >= 5 ? 'critical' : 'warning',
          message: `AI citation mentions decreased from ${lastKnownCitationCount} to ${citationCount} (−${drop}). Your site is being referenced less by AI engines like Perplexity and ChatGPT.`,
          data: JSON.stringify({ previousCount: lastKnownCitationCount, currentCount: citationCount, drop, sources: citationSources.slice(0, 5) }),
        },
      })
      createdAlerts.push(alert)
    }

    // Check 4: llms.txt was removed
    if (lastKnownLlmsTxt && !llmsTxtExists) {
      const alert = await db.visibilityAlert.create({
        data: {
          userId: alertUserId,
          domain,
          alertType: 'llms_txt_removed',
          severity: 'warning',
          message: `llms.txt file was removed from your site. AI crawlers use this file to discover and understand your content. Re-create it to maintain AI discoverability.`,
          data: JSON.stringify({ previouslyPresent: true, currentlyPresent: false }),
        },
      })
      createdAlerts.push(alert)
    }

    // Check 5: AI Overview presence check via search
    let aiOverviewDetected = false
    try {
      const overviewSearch = await zai.functions.invoke('web_search', {
        query: `${domain} AI overview Google`,
        num: 5,
      })
      if (overviewSearch && Array.isArray(overviewSearch) && overviewSearch.length > 0) {
        aiOverviewDetected = true
      }
    } catch {
      // Search may fail
    }

    // If no AI Overview presence found and we have citations before
    if (!aiOverviewDetected && lastKnownCitationCount > 3) {
      const existingOverviewAlert = await db.visibilityAlert.findFirst({
        where: { domain, alertType: 'ai_overview_lost', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      })

      if (!existingOverviewAlert) {
        const alert = await db.visibilityAlert.create({
          data: {
            userId: alertUserId,
            domain,
            alertType: 'ai_overview_lost',
            severity: 'warning',
            message: `No AI Overview presence detected for ${domain}. Your site may have lost its position in Google's AI-generated search responses. Review your structured data and content formatting.`,
            data: JSON.stringify({ aiOverviewDetected, checkedAt: new Date().toISOString() }),
          },
        })
        createdAlerts.push(alert)
      }
    }

    // If no alerts were created but the check was successful, create an info alert
    if (createdAlerts.length === 0) {
      const infoAlert = await db.visibilityAlert.create({
        data: {
          userId: alertUserId,
          domain,
          alertType: 'score_change',
          severity: 'info',
          message: `Visibility check completed for ${domain}. No significant changes detected. ${currentlyBlockedBots.length > 0 ? `${currentlyBlockedBots.length} bots blocked, ${currentBotStatus.length - currentlyBlockedBots.length} allowed. ` : ''}${llmsTxtExists ? 'llms.txt present.' : 'llms.txt not found — consider creating one.'} ${citationCount} AI citation${citationCount !== 1 ? 's' : ''} found.`,
          data: JSON.stringify({
            citationCount,
            citationSources: citationSources.slice(0, 5),
            blockedBots: currentlyBlockedBots,
            allowedBots: currentBotStatus.filter(b => !b.blocked).map(b => b.bot),
            llmsTxtExists,
            aiOverviewDetected,
          }),
        },
      })
      createdAlerts.push(infoAlert)
    }

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      domain,
      summary: {
        citationsFound: citationCount,
        botsBlocked: currentlyBlockedBots.length,
        botsAllowed: currentBotStatus.filter(b => !b.blocked).length,
        llmsTxtExists,
        aiOverviewDetected,
      },
      alertsCreated: createdAlerts.length,
      alerts: createdAlerts,
    })
  } catch (error) {
    console.error('[alerts/check] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Visibility check failed' },
      { status: 500 }
    )
  }
}
