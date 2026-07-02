/**
 * Factory Changelog API — GET /api/factory/changelog
 *
 * Returns FactoryChangelog records ordered by releaseDate desc.
 * Limited to the 20 most recent releases.
 *
 * Each record includes the added / fixed / breaking / migration arrays
 * (parsed from their JSON-stringified DB columns into real arrays for
 * the dashboard to render).
 *
 * On DB failure (first run / empty DB), returns an empty list with HTTP 200
 * so the UI shows the empty state instead of an error.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string')
    }
    return []
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const records = await db.factoryChangelog.findMany({
      orderBy: { releaseDate: 'desc' },
      take: 20,
    })

    const changelog = records.map((r) => ({
      id: r.id,
      version: r.version,
      releaseDate: r.releaseDate,
      added: safeParseArray(r.added),
      fixed: safeParseArray(r.fixed),
      breaking: safeParseArray(r.breaking),
      migration: safeParseArray(r.migration),
      taskId: r.taskId,
      deployCommit: r.deployCommit,
      author: r.author,
      filesChanged: r.filesChanged,
      linesAdded: r.linesAdded,
      linesRemoved: r.linesRemoved,
    }))

    return NextResponse.json({ changelog, count: changelog.length })
  } catch (error) {
    console.error('[api/factory/changelog] Failed:', error)
    return NextResponse.json(
      {
        changelog: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 },
    )
  }
}
