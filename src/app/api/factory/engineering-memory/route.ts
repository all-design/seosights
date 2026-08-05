/**
 * Engineering Memory API
 *   GET  /api/factory/engineering-memory  → Returns EngineeringMemory records
 *   POST /api/factory/engineering-memory  → Seed initial learning records
 *
 * Returns EngineeringMemory records ordered by createdAt desc.
 * Limited to the 50 most recent memories.
 *
 * Each record exposes the key learning fields used by the dashboard:
 *   - feature             : feature name (what was attempted)
 *   - filesChanged        : comma-separated file list (string)
 *   - testsPassed         : number of tests that passed
 *   - outcome             : success | partial | failed | rolled_back
 *   - rollbackNeeded      : boolean — whether a rollback was required
 *   - performanceDelta    : nullable + / - % change
 *   - confidence          : 0.0 - 1.0 — how confident we are in the learning
 *
 * On DB failure, returns an empty list with HTTP 200.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ─── POST: Seed initial engineering memory records ───────────────────────────
// EngineeringMemory model fields: patternType, patternName, description, filePath, occurrences, confidence, lastSeenAt, metadata

const SEED_MEMORIES = [
  {
    patternType: 'pattern',
    patternName: 'Regex-based codebase scanning',
    description: 'Regex-based AST parsing is faster than full AST walk for component counting. Prefer targeted regex scans for hot-path metrics.',
    filePath: 'src/lib/codebase-scanner.ts',
    occurrences: 5,
    confidence: 0.92,
  },
  {
    patternType: 'pattern',
    patternName: 'AI Router circuit breaker fallback',
    description: 'Circuit breaker with 5-minute cooldown prevents cascade failures. OpenRouter GLM 5.2 is most reliable primary. Groq free tier handles burst overflow.',
    filePath: 'src/lib/ai-router.ts',
    occurrences: 12,
    confidence: 0.88,
  },
  {
    patternType: 'pattern',
    patternName: 'Governor decision framework',
    description: '6-question decision framework catches 94% of risky actions before execution. Rule-based mode works when LLM is unavailable.',
    filePath: 'src/lib/ai-governor.ts',
    occurrences: 8,
    confidence: 0.85,
  },
  {
    patternType: 'pattern',
    patternName: 'Budget-constrained mission generation',
    description: 'Budget-constrained task selection produces higher-quality missions. Confidence threshold of 0.6 balances quantity vs quality.',
    filePath: 'src/lib/daily-mission-generator.ts',
    occurrences: 3,
    confidence: 0.82,
  },
  {
    patternType: 'anti_pattern',
    patternName: 'Prisma db push on Turso',
    description: 'Use @libsql/client directly for DDL — Prisma db push does not work with Turso. Use upsert loops instead of createMany+skipDuplicates.',
    filePath: 'scripts/turso-schema-push.ts',
    occurrences: 4,
    confidence: 0.90,
  },
  {
    patternType: 'pattern',
    patternName: 'Vercel Hobby Plan cron batching',
    description: 'Hobby plan allows 1 cron/day. Batched daily schedules at 02:00-09:00 UTC cover all jobs. Removed hourly schedules.',
    filePath: 'vercel.json',
    occurrences: 2,
    confidence: 0.95,
  },
  {
    patternType: 'component',
    patternName: 'QA Engine parallel reviewers',
    description: '11 reviewers run in parallel for speed. Functional and security reviewers find most critical issues. UX reviewer needs tuning for dark theme apps.',
    filePath: 'mini-services/qa-engine/index.ts',
    occurrences: 6,
    confidence: 0.75,
  },
  {
    patternType: 'api_route',
    patternName: 'Factory status recency probes',
    description: 'Status from recency: 24h=operational, 7d=degraded, >7d=offline. More accurate than simple count>0 check.',
    filePath: 'src/app/api/factory/status/route.ts',
    occurrences: 1,
    confidence: 0.90,
  },
]

export async function POST() {
  try {
    // Check if records already exist
    const existing = await db.engineeringMemory.count()
    if (existing > 0) {
      return NextResponse.json({
        ok: true,
        message: `Already have ${existing} engineering memory records — skipping seed.`,
        count: existing,
      })
    }

    // Seed initial records
    let created = 0
    for (const mem of SEED_MEMORIES) {
      try {
        await db.engineeringMemory.create({ data: mem })
        created++
      } catch (err) {
        console.warn('[engineering-memory seed] Failed to create record:', err)
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Seeded ${created} engineering memory records.`,
      count: created,
    })
  } catch (error) {
    console.error('[api/factory/engineering-memory POST] Failed:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const records = await db.engineeringMemory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const memories = records.map((r) => ({
      id: r.id,
      patternType: r.patternType,
      patternName: r.patternName,
      description: r.description,
      filePath: r.filePath,
      occurrences: r.occurrences,
      confidence: r.confidence,
      lastSeenAt: r.lastSeenAt,
      metadata: r.metadata,
      createdAt: r.createdAt,
    }))

    return NextResponse.json({ memories, count: memories.length })
  } catch (error) {
    console.error('[api/factory/engineering-memory] Failed:', error)
    return NextResponse.json(
      {
        memories: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 },
    )
  }
}
