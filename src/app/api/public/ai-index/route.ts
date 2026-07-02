import { NextRequest, NextResponse } from 'next/server'
import { safeQuery } from '@/lib/safe-query'

/**
 * Public AI Engine Status Index
 * GET /api/public/ai-index — Get all engine statuses
 * This is PUBLIC data — no auth required.
 */

export async function GET() {
  const result = await safeQuery(
    (db) => db.aIEngineStatus.findMany({
      orderBy: { lastUpdate: 'desc' },
    }),
    [],
    { api: 'public-ai-index', confidence: 95 }
  )

  const hasLiveData = result.status === 'live' && result.data.length > 0

  // Fallback: seed data
  const seedData = [
    {
      engine: 'openai',
      engineLabel: 'OpenAI',
      modelVersion: 'GPT-4o',
      status: 'operational',
      lastUpdate: new Date('2025-03-15').toISOString(),
      updateNotes: 'GPT-4o with improved reasoning and multimodal capabilities',
      crawlerBot: 'GPTBot',
      crawlFrequency: 'Daily',
      citationTendency: 'High',
      userBase: '200M+ weekly',
      apiAvailable: true,
    },
    {
      engine: 'anthropic',
      engineLabel: 'Anthropic (Claude)',
      modelVersion: 'Claude 3.5 Sonnet',
      status: 'operational',
      lastUpdate: new Date('2025-02-20').toISOString(),
      updateNotes: 'Claude 3.5 Sonnet with enhanced analysis capabilities',
      crawlerBot: 'ClaudeBot',
      crawlFrequency: 'Weekly',
      citationTendency: 'High',
      userBase: '100M+ monthly',
      apiAvailable: true,
    },
    {
      engine: 'google',
      engineLabel: 'Google (Gemini)',
      modelVersion: 'Gemini 2.0 Flash',
      status: 'new_release',
      lastUpdate: new Date('2025-03-10').toISOString(),
      updateNotes: 'Gemini 2.0 Flash — new faster model with improved grounding',
      crawlerBot: 'Google-Extended',
      crawlFrequency: 'Daily',
      citationTendency: 'Medium',
      userBase: '300M+ monthly',
      apiAvailable: true,
    },
    {
      engine: 'perplexity',
      engineLabel: 'Perplexity',
      modelVersion: 'Sonar Large',
      status: 'operational',
      lastUpdate: new Date().toISOString(),
      updateNotes: 'Real-time web search with source citations',
      crawlerBot: 'PerplexityBot',
      crawlFrequency: 'Real-time',
      citationTendency: 'Very High',
      userBase: '15M+ daily',
      apiAvailable: true,
    },
    {
      engine: 'meta',
      engineLabel: 'Meta (Llama)',
      modelVersion: 'Llama 3.1 405B',
      status: 'operational',
      lastUpdate: new Date('2025-01-15').toISOString(),
      updateNotes: 'Open-source model, increasingly used in AI tools',
      crawlerBot: 'MetaBot',
      crawlFrequency: 'Weekly',
      citationTendency: 'Low',
      userBase: 'Open source',
      apiAvailable: false,
    },
  ]

  return NextResponse.json({
    status: hasLiveData ? 'live' : 'estimated',
    confidence: hasLiveData ? 95 : 70,
    data: {
      engines: hasLiveData ? result.data : seedData,
      lastUpdated: new Date().toISOString(),
      updateFrequency: 'daily',
      disclaimer: 'AI engine statuses are based on publicly available information and automated testing. Actual behavior may vary.',
    },
  })
}
