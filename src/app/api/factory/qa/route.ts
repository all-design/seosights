/**
 * Factory QA — GET /api/factory/qa
 *
 * Returns the most recent persisted QARun record from the DB.
 *
 * Response shape:
 *   { qaRun: {...} | null, error?: string }
 *
 * Always returns HTTP 200 — `qaRun: null` is a valid empty state.
 *
 * Implementation note: production Turso QARun table has severe schema drift
 * (missing errorCount, warningCount, fixableCount, errors, warnings,
 * durationMs, runType, taskId columns — only id/status/timestamp exist).
 * This is a database migration gap that requires `prisma db push` on the
 * production Turso instance to fully resolve.
 *
 * Rather than crash, we return `qaRun: null` so the QA page shows its
 * "Run QA Scan" empty state. Clicking that button POSTs to
 * /api/factory/qa/run which runs ESLint and returns the result directly
 * to the UI (works regardless of DB schema).
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Try Prisma findFirst with minimal columns.
    // On local SQLite (schema in sync) this returns the real latest run.
    // On production Turso (schema drift) this throws and we fall through.
    try {
      const latest = await db.qARun.findFirst({
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          runType: true,
          status: true,
          errorCount: true,
          warningCount: true,
          fixableCount: true,
          errors: true,
          warnings: true,
          durationMs: true,
          timestamp: true,
        },
      })
      if (latest) {
        return NextResponse.json({ qaRun: latest })
      }
      return NextResponse.json({ qaRun: null })
    } catch {
      // Schema drift on production Turso — columns missing.
      // Return null; the QA page shows "Run QA Scan" button which works.
      return NextResponse.json({
        qaRun: null,
        note: 'QARun table has schema drift on this database. Click "Run QA Scan" to execute a fresh ESLint run — the result displays immediately.',
      })
    }
  } catch (error) {
    console.error('[api/factory/qa GET] Failed:', error)
    return NextResponse.json(
      {
        qaRun: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 },
    )
  }
}
