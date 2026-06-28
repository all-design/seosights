import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * AI Crawl Logs API
 *
 * GET /api/dashboard/crawl-logs?url=example.com&bot=GPTBot
 *
 * Returns AI crawler bot activity for the user's site:
 *   - summary: totals + trend
 *   - bots: per-bot status (allowed/blocked/restricted) with last-seen
 *   - logs: recent access log entries (last 24h)
 *   - alerts: actionable alerts (e.g. GPTBot blocked by robots.txt)
 *
 * Currently returns realistic mock data. Swap getMockData() for a DB
 * query against server logs / Cloudflare logs once wired up.
 */

// ── Types ──────────────────────────────────────────────
type BotStatus = 'allowed' | 'blocked' | 'restricted'
type BotName =
  | 'GPTBot'
  | 'ClaudeBot'
  | 'PerplexityBot'
  | 'Googlebot'
  | 'Bytespider'
  | 'Applebot'

interface Summary {
  totalVisits: number
  allowedBots: number
  blockedBots: number
  trend: number
}

interface BotInfo {
  name: BotName
  status: BotStatus
  lastSeen: string
  visitCount: number
  color: string
}

interface LogEntry {
  time: string
  bot: BotName
  ip: string
  path: string
  status: number
  responseTime: number
  userAgent: string
}

interface CrawlAlert {
  bot: BotName
  message: string
  severity: 'critical' | 'warning' | 'info'
}

interface CrawlData {
  summary: Summary
  bots: BotInfo[]
  logs: LogEntry[]
  alerts: CrawlAlert[]
}

// ── Bot palette (no indigo / blue as primary accent) ──
const BOT_COLORS: Record<BotName, string> = {
  GPTBot: '#10b981',
  ClaudeBot: '#fb923c',
  PerplexityBot: '#2dd4bf',
  Googlebot: '#fbbf24',
  Bytespider: '#fb7185',
  Applebot: '#a1a1aa',
}

// ── Real-world user agent strings ──────────────────────
const USER_AGENTS: Record<BotName, string> = {
  GPTBot: 'GPTBot/1.2; +https://openai.com/gptbot',
  ClaudeBot: 'ClaudeBot/1.0; +mailto:bot@anthropic.com',
  PerplexityBot: 'PerplexityBot/1.0; +https://docs.perplexity.ai/docs/bot',
  Googlebot:
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Bytespider: 'Bytespider; spider-feedback@bytedance.com',
  Applebot:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Applebot/0.1; +http://www.apple.com/go/applebot',
}

function isoMinus(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

// ── Mock data (realistic 24h window) ───────────────────
function getMockData(): CrawlData {
  return {
    summary: {
      totalVisits: 1247,
      allowedBots: 3,
      blockedBots: 3,
      trend: 18,
    },
    bots: [
      { name: 'GPTBot', status: 'blocked', lastSeen: isoMinus(14), visitCount: 312, color: BOT_COLORS.GPTBot },
      { name: 'ClaudeBot', status: 'allowed', lastSeen: isoMinus(2), visitCount: 387, color: BOT_COLORS.ClaudeBot },
      { name: 'PerplexityBot', status: 'allowed', lastSeen: isoMinus(8), visitCount: 256, color: BOT_COLORS.PerplexityBot },
      { name: 'Googlebot', status: 'allowed', lastSeen: isoMinus(1), visitCount: 412, color: BOT_COLORS.Googlebot },
      { name: 'Bytespider', status: 'blocked', lastSeen: isoMinus(184), visitCount: 89, color: BOT_COLORS.Bytespider },
      { name: 'Applebot', status: 'blocked', lastSeen: isoMinus(57), visitCount: 67, color: BOT_COLORS.Applebot },
    ],
    logs: [
      { time: isoMinus(1), bot: 'Googlebot', ip: '66.249.66.91', path: '/', status: 200, responseTime: 124, userAgent: USER_AGENTS.Googlebot },
      { time: isoMinus(2), bot: 'ClaudeBot', ip: '54.241.140.121', path: '/blog/aeo-guide', status: 200, responseTime: 211, userAgent: USER_AGENTS.ClaudeBot },
      { time: isoMinus(3), bot: 'Googlebot', ip: '66.249.66.144', path: '/pricing', status: 200, responseTime: 98, userAgent: USER_AGENTS.Googlebot },
      { time: isoMinus(8), bot: 'PerplexityBot', ip: '54.161.81.16', path: '/blog/geo-optimization', status: 200, responseTime: 167, userAgent: USER_AGENTS.PerplexityBot },
      { time: isoMinus(14), bot: 'GPTBot', ip: '20.171.207.45', path: '/blog/ai-search-ranking', status: 403, responseTime: 12, userAgent: USER_AGENTS.GPTBot },
      { time: isoMinus(22), bot: 'ClaudeBot', ip: '54.241.140.122', path: '/llms.txt', status: 200, responseTime: 41, userAgent: USER_AGENTS.ClaudeBot },
      { time: isoMinus(31), bot: 'Googlebot', ip: '66.249.66.92', path: '/sitemap.xml', status: 200, responseTime: 67, userAgent: USER_AGENTS.Googlebot },
      { time: isoMinus(48), bot: 'GPTBot', ip: '20.171.207.46', path: '/', status: 403, responseTime: 9, userAgent: USER_AGENTS.GPTBot },
      { time: isoMinus(57), bot: 'Applebot', ip: '17.121.112.18', path: '/docs/schema-markup', status: 403, responseTime: 11, userAgent: USER_AGENTS.Applebot },
      { time: isoMinus(74), bot: 'PerplexityBot', ip: '54.161.81.17', path: '/case-studies/ai-search', status: 200, responseTime: 189, userAgent: USER_AGENTS.PerplexityBot },
      { time: isoMinus(123), bot: 'ClaudeBot', ip: '54.241.140.123', path: '/faq', status: 200, responseTime: 88, userAgent: USER_AGENTS.ClaudeBot },
      { time: isoMinus(184), bot: 'Bytespider', ip: '110.53.92.41', path: '/blog/geo-optimization', status: 403, responseTime: 14, userAgent: USER_AGENTS.Bytespider },
    ],
    alerts: [
      {
        bot: 'GPTBot',
        message: 'GPTBot is BLOCKED by your robots.txt — ChatGPT cannot read your site.',
        severity: 'critical',
      },
      {
        bot: 'Bytespider',
        message: 'Bytespider is blocked. ByteDance AI search (Douyin AI) cannot access your content.',
        severity: 'warning',
      },
      {
        bot: 'Applebot',
        message: 'Applebot is blocked. Apple Intelligence & Siri summaries cannot access your content.',
        severity: 'info',
      },
    ],
  }
}

// ── GET handler ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const bot = searchParams.get('bot')

    const data = getMockData()

    // Optional bot filter (case-insensitive match on bot name)
    let logs = data.logs
    if (bot) {
      const needle = bot.toLowerCase()
      logs = logs.filter((l) => l.bot.toLowerCase() === needle)
    }

    return NextResponse.json({
      summary: data.summary,
      bots: data.bots,
      logs,
      alerts: data.alerts,
      // Echo back the requested scope for client display
      url: url || null,
      bot: bot || null,
    })
  } catch (error) {
    console.error(
      '[crawl-logs] GET error:',
      error instanceof Error ? error.message : 'Unknown'
    )
    const data = getMockData()
    return NextResponse.json({
      summary: data.summary,
      bots: data.bots,
      logs: data.logs,
      alerts: data.alerts,
      url: null,
      bot: null,
    })
  }
}
