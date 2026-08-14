/**
 * Web Vitals RUM Endpoint — POST /api/control/performance/vitals
 * Receives real Core Web Vitals measurements from user sessions.
 * Stores them in the database for aggregation and monitoring.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// In-memory buffer to batch writes (reduce DB pressure)
const vitalsBuffer: Array<{
  name: string
  value: number
  rating: string
  path: string
  timestamp: number
}> = []

let lastFlush = Date.now()
const FLUSH_INTERVAL = 30000 // 30 seconds
const MAX_BUFFER_SIZE = 50

async function flushVitals() {
  if (vitalsBuffer.length === 0) return

  const batch = [...vitalsBuffer]
  vitalsBuffer.length = 0

  try {
    // Get or create a RUM QA run
    let rumRun = await db.qARun.findFirst({
      where: { triggeredBy: 'rum_vitals', status: 'completed' },
      orderBy: { startedAt: 'desc' },
    })

    // Create a new RUM run every 24 hours
    if (!rumRun || (Date.now() - (rumRun.startedAt?.getTime() ?? 0)) > 86400000) {
      rumRun = await db.qARun.create({
        data: {
          status: 'completed',
          triggeredBy: 'rum_vitals',
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 0,
        },
      })
    }

    // Write each vital as a page test record
    for (const vital of batch) {
      await db.qAPageTest.create({
        data: {
          runId: rumRun.id,
          route: vital.path,
          url: vital.path,
          loadTime: Math.round(vital.value),
          statusCode: 200,
          hasErrors: vital.rating === 'poor',
          errorCount: vital.rating === 'poor' ? 1 : 0,
          lighthouseScore: vital.name === 'LCP' ? (vital.value <= 2500 ? 90 : vital.value <= 4000 ? 50 : 10) : 0,
          accessibilityScore: 0,
        },
      })
    }

    console.log(`[RUM] Flushed ${batch.length} vitals to DB`)
  } catch (error: any) {
    console.error('[RUM] Flush error:', error.message)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { name, value, rating, path } = body

    if (!name || typeof value !== 'number' || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Add to buffer
    vitalsBuffer.push({
      name,
      value,
      rating,
      path: path || '/',
      timestamp: body.timestamp || Date.now(),
    })

    // Flush if buffer is full or interval elapsed
    const now = Date.now()
    if (vitalsBuffer.length >= MAX_BUFFER_SIZE || (now - lastFlush) >= FLUSH_INTERVAL) {
      lastFlush = now
      // Don't await — fire and forget to not block the response
      flushVitals().catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to process vital' }, { status: 500 })
  }
}

/**
 * GET — Returns aggregated RUM vitals
 */
export async function GET() {
  // Force flush first
  await flushVitals()

  try {
    const rumRun = await db.qARun.findFirst({
      where: { triggeredBy: 'rum_vitals', status: 'completed' },
      orderBy: { startedAt: 'desc' },
    })

    if (!rumRun) {
      return NextResponse.json({ hasData: false, message: 'No RUM data yet' })
    }

    const pageTests = await db.qAPageTest.findMany({
      where: { runId: rumRun.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Aggregate by route
    const byRoute: Record<string, { count: number; avgLoadTime: number; maxLoadTime: number; poorCount: number }> = {}
    for (const test of pageTests) {
      const route = test.route || '/'
      if (!byRoute[route]) {
        byRoute[route] = { count: 0, avgLoadTime: 0, maxLoadTime: 0, poorCount: 0 }
      }
      byRoute[route].count++
      byRoute[route].avgLoadTime += test.loadTime
      byRoute[route].maxLoadTime = Math.max(byRoute[route].maxLoadTime, test.loadTime)
      if (test.hasErrors) byRoute[route].poorCount++
    }

    // Calculate averages
    for (const route of Object.keys(byRoute)) {
      byRoute[route].avgLoadTime = Math.round(byRoute[route].avgLoadTime / byRoute[route].count)
    }

    return NextResponse.json({
      hasData: true,
      runId: rumRun.id,
      startedAt: rumRun.startedAt,
      totalMeasurements: pageTests.length,
      byRoute,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch RUM data' }, { status: 500 })
  }
}
