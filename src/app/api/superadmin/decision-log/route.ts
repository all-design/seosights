import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET: List Decision Log entries ────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const changeType = searchParams.get('changeType')
    const verified = searchParams.get('verified')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (category) where.changeCategory = category
    if (changeType) where.changeType = changeType
    if (verified !== null && verified !== '') where.verified = verified === 'true'

    const entries = await db.decisionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.decisionLog.count({ where })

    // If no entries exist yet, return seed data
    if (total === 0) {
      return NextResponse.json({
        entries: generateSeedDecisionLog(),
        total: generateSeedDecisionLog().length,
        seed: true,
      })
    }

    return NextResponse.json({ entries, total, seed: false })
  } catch (error) {
    console.error('[decision-log] GET Error:', error)
    return NextResponse.json(
      { entries: generateSeedDecisionLog(), total: generateSeedDecisionLog().length, seed: true, error: error instanceof Error ? error.message : 'Failed to fetch decision log' },
      { status: 200 }
    )
  }
}

// ─── POST: Create Decision Log entry ───────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { changeType, changeTitle, changeDescription, changeCategory, beforeState, afterState, author, source, tags } = body

    if (!changeType || !changeTitle || !changeDescription || !changeCategory) {
      return NextResponse.json(
        { error: 'Missing required fields: changeType, changeTitle, changeDescription, changeCategory' },
        { status: 400 }
      )
    }

    const entry = await db.decisionLog.create({
      data: {
        changeType,
        changeTitle,
        changeDescription,
        changeCategory,
        beforeState: beforeState ? JSON.stringify(beforeState) : null,
        afterState: afterState ? JSON.stringify(afterState) : null,
        author: author || 'superadmin',
        source: source || 'manual',
        tags: tags ? JSON.stringify(tags) : null,
        aiScoreDelta: 0,
        signupDelta: 0,
        conversionDelta: 0,
        revenueDelta: 0,
        citationDelta: 0,
        verified: false,
      },
    })

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('[decision-log] POST Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create decision log entry' },
      { status: 500 }
    )
  }
}

// ─── Seed Data ─────────────────────────────────────────────────────────

function generateSeedDecisionLog() {
  const now = Date.now()
  return [
    {
      id: 'dl-1',
      changeType: 'content_change',
      changeTitle: 'Added FAQ section to /pricing',
      changeDescription: 'Added 8 frequently asked questions to the pricing page to address common objections about AI visibility scoring methodology, data freshness, and enterprise pricing.',
      changeCategory: 'content',
      aiScoreDelta: 3,
      signupDelta: 7.2,
      conversionDelta: 2.1,
      revenueDelta: 0,
      citationDelta: 2,
      author: 'superadmin',
      source: 'ai_twin',
      verified: true,
      verifiedAt: new Date(now - 86400000).toISOString(),
      createdAt: new Date(now - 172800000).toISOString(),
    },
    {
      id: 'dl-2',
      changeType: 'schema_change',
      changeTitle: 'Updated Organization schema on homepage',
      changeDescription: 'Added SameAs property with social media links and updated logo URL to CDN-hosted version. Also added aggregateRating schema.',
      changeCategory: 'technical',
      aiScoreDelta: 5,
      signupDelta: 0,
      conversionDelta: 0.5,
      revenueDelta: 0,
      citationDelta: 4,
      author: 'auto_execute',
      source: 'auto_execute',
      verified: true,
      verifiedAt: new Date(now - 43200000).toISOString(),
      createdAt: new Date(now - 259200000).toISOString(),
    },
    {
      id: 'dl-3',
      changeType: 'feature_added',
      changeTitle: 'Launched AI Product Twin™ daily briefings',
      changeDescription: 'New feature that generates daily PM-style recommendations based on churn signals, feature adoption metrics, and AI visibility scores. Accessible from Superadmin panel.',
      changeCategory: 'technical',
      aiScoreDelta: 8,
      signupDelta: 12.5,
      conversionDelta: 4.3,
      revenueDelta: 240,
      citationDelta: 6,
      author: 'superadmin',
      source: 'manual',
      verified: false,
      verifiedAt: null,
      createdAt: new Date(now - 345600000).toISOString(),
    },
    {
      id: 'dl-4',
      changeType: 'content_change',
      changeTitle: 'Rewrote hero headline for clarity',
      changeDescription: 'Changed from "AI SEO Platform" to "AI Visibility Intelligence Engine™" to better communicate the unique value proposition. Added supporting sub-headline.',
      changeCategory: 'content',
      aiScoreDelta: 2,
      signupDelta: 5.8,
      conversionDelta: 1.9,
      revenueDelta: 0,
      citationDelta: 1,
      author: 'superadmin',
      source: 'manual',
      verified: true,
      verifiedAt: new Date(now - 172800000).toISOString(),
      createdAt: new Date(now - 432000000).toISOString(),
    },
    {
      id: 'dl-5',
      changeType: 'config_change',
      changeTitle: 'Switched AI Router default to Groq Llama 3.1 70B',
      changeDescription: 'Moved from Gemini Flash as primary to Groq for scoring and summarization tasks. Gemini remains secondary fallback. This reduces latency by ~200ms on average.',
      changeCategory: 'infrastructure',
      aiScoreDelta: 0,
      signupDelta: 0,
      conversionDelta: 0,
      revenueDelta: -12.50,
      citationDelta: 0,
      author: 'auto_execute',
      source: 'deploy',
      verified: true,
      verifiedAt: new Date(now - 86400000).toISOString(),
      createdAt: new Date(now - 518400000).toISOString(),
    },
    {
      id: 'dl-6',
      changeType: 'design_change',
      changeTitle: 'Updated pricing card layout to 3-column',
      changeDescription: 'Changed pricing section from 4-column to 3-column layout with "Most Popular" badge on Pro tier. Added feature comparison toggle.',
      changeCategory: 'design',
      aiScoreDelta: 1,
      signupDelta: 15.3,
      conversionDelta: 6.7,
      revenueDelta: 890,
      citationDelta: 0,
      author: 'superadmin',
      source: 'manual',
      verified: false,
      verifiedAt: null,
      createdAt: new Date(now - 604800000).toISOString(),
    },
    {
      id: 'dl-7',
      changeType: 'content_change',
      changeTitle: 'Added llms.txt to public root',
      changeDescription: 'Created comprehensive llms.txt file with product description, key features, API documentation summary, and pricing information for AI crawlers.',
      changeCategory: 'content',
      aiScoreDelta: 6,
      signupDelta: 0,
      conversionDelta: 0,
      revenueDelta: 0,
      citationDelta: 8,
      author: 'auto_execute',
      source: 'auto_execute',
      verified: true,
      verifiedAt: new Date(now - 259200000).toISOString(),
      createdAt: new Date(now - 691200000).toISOString(),
    },
    {
      id: 'dl-8',
      changeType: 'deploy',
      changeTitle: 'Deployed v2.4.0 — QA Orchestrator + Decision Log',
      changeDescription: 'Major release adding AI QA Orchestrator (400+ automated tests), Decision Log with impact correlation, and AI Product Twin™ insights.',
      changeCategory: 'infrastructure',
      aiScoreDelta: 0,
      signupDelta: 0,
      conversionDelta: 0,
      revenueDelta: 0,
      citationDelta: 0,
      author: 'superadmin',
      source: 'deploy',
      verified: true,
      verifiedAt: new Date(now - 7200000).toISOString(),
      createdAt: new Date(now - 777600000).toISOString(),
    },
    {
      id: 'dl-9',
      changeType: 'feature_added',
      changeTitle: 'Added Chrome Extension sidebar overlay',
      changeDescription: 'New sidebar overlay in Chrome Extension that shows AI visibility score, citation count, and quick actions while browsing competitor sites.',
      changeCategory: 'technical',
      aiScoreDelta: 4,
      signupDelta: 8.1,
      conversionDelta: 2.5,
      revenueDelta: 150,
      citationDelta: 3,
      author: 'superadmin',
      source: 'manual',
      verified: false,
      verifiedAt: null,
      createdAt: new Date(now - 864000000).toISOString(),
    },
    {
      id: 'dl-10',
      changeType: 'rollback',
      changeTitle: 'Rolled back Stripe webhook handler v3',
      changeDescription: 'Webhook handler v3 was causing duplicate events on subscription updates. Rolled back to v2 while investigating root cause.',
      changeCategory: 'infrastructure',
      aiScoreDelta: -1,
      signupDelta: 0,
      conversionDelta: -0.3,
      revenueDelta: -45,
      citationDelta: 0,
      author: 'auto_execute',
      source: 'auto_execute',
      verified: true,
      verifiedAt: new Date(now - 86400000).toISOString(),
      createdAt: new Date(now - 950400000).toISOString(),
    },
  ]
}
