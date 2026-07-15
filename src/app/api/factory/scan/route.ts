/**
 * Factory Scan API
 *  - POST /api/factory/scan        → triggers a fresh codebase scan + saves snapshot
 *  - GET  /api/factory/scan        → returns the latest CodebaseSnapshot from DB
 *                                    (auto-triggers a scan if none exists)
 *
 * The underlying scanner walks src/, parses the Prisma schema, and persists
 * a CodebaseSnapshot row. The scan typically takes 1–5 seconds, never throws,
 * and degrades gracefully when DB is unavailable.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  scanCodebase,
  scanAndSaveSnapshot,
  type ScanResult,
} from '@/lib/codebase-scanner'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely parse a JSON string stored in a CodebaseSnapshot column. */
function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Convert a stored CodebaseSnapshot row into a public JSON shape. */
function serializeSnapshot(row: {
  id: string
  createdAt: Date
  totalComponents: number
  totalAPIRoutes: number
  totalPrismaModels: number
  totalPages: number
  totalHooks: number
  totalLibs: number
  lintErrors: number
  lintWarnings: number
  typescriptErrors: number
  components: string | null
  apiRoutes: string | null
  prismaModels: string | null
}) {
  return {
    id: row.id,
    timestamp: row.createdAt,
    stats: {
      totalComponents: row.totalComponents,
      totalAPIRoutes: row.totalAPIRoutes,
      totalPrismaModels: row.totalPrismaModels,
      totalPages: row.totalPages,
      totalHooks: row.totalHooks,
      totalLibs: row.totalLibs,
      lintErrors: row.lintErrors,
      lintWarnings: row.lintWarnings,
      typescriptErrors: row.typescriptErrors,
    },
    components: safeParse(row.components, []),
    apiRoutes: safeParse(row.apiRoutes, []),
    prismaModels: safeParse(row.prismaModels, []),
  }
}

// ─── POST: trigger a fresh scan ───────────────────────────────────────────────

export async function POST() {
  try {
    const scanResult: ScanResult = await scanAndSaveSnapshot()

    return NextResponse.json({
      ok: true,
      timestamp: scanResult.timestamp,
      stats: scanResult.stats,
      // Keep the heavy arrays out of the immediate response — the GET endpoint
      // is the canonical source for the latest snapshot. We still return counts
      // here so the dashboard can confirm a scan happened.
      counts: {
        components: scanResult.components.length,
        apiRoutes: scanResult.apiRoutes.length,
        prismaModels: scanResult.prismaModels.length,
        pages: scanResult.pages.length,
        hooks: scanResult.hooks.length,
        libs: scanResult.libs.length,
      },
    })
  } catch (error) {
    console.error('[api/factory/scan POST] Failed:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// ─── GET: latest snapshot (auto-scan if none exists) ─────────────────────────

export async function GET() {
  try {
    let snapshot = await db.codebaseSnapshot.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    // First run / empty DB → run a fresh scan so the UI has something to show.
    if (!snapshot) {
      console.log('[api/factory/scan GET] No snapshot found — auto-scanning…')
      await scanAndSaveSnapshot()
      snapshot = await db.codebaseSnapshot.findFirst({
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!snapshot) {
      // Scan failed to persist (DB unavailable). Still return a fresh in-memory
      // scan so the dashboard can render something.
      const live = await scanCodebase()
      return NextResponse.json({
        stats: live.stats,
        components: live.components,
        apiRoutes: live.apiRoutes,
        prismaModels: live.prismaModels,
        pages: live.pages,
        timestamp: live.timestamp,
        persisted: false,
      })
    }

    // Optionally include pages from the in-memory scan, since pages are NOT
    // persisted as JSON in the current schema (only counts are).
    let pages: ScanResult['pages'] = []
    try {
      const live = await scanCodebase()
      pages = live.pages
    } catch {
      // ignore — pages array is best-effort
    }

    const serialized = serializeSnapshot(snapshot)
    return NextResponse.json({
      ...serialized,
      pages,
      persisted: true,
    })
  } catch (error) {
    console.error('[api/factory/scan GET] Failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stats: null,
        components: [],
        apiRoutes: [],
        prismaModels: [],
        pages: [],
      },
      { status: 500 },
    )
  }
}
