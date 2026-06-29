/**
 * Content Engine — Editorial Calendar
 *
 * GET  /api/content-engine/editorial-calendar   — Calendar entries for a date range
 * POST /api/content-engine/editorial-calendar   — Generate calendar entries for upcoming days
 * PUT  /api/content-engine/editorial-calendar   — Update a calendar entry
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_DOMAIN = 'seosights.com'

// ── Weekly Theme Schedule ─────────────────────────────────────────────────────

const WEEKLY_THEMES: Record<number, { theme: string; pillar: string }> = {
  1: { theme: 'Entity SEO Mondays', pillar: 'seo' },         // Monday
  2: { theme: 'Claude SEO / GEO Tuesdays', pillar: 'geo' },  // Tuesday
  3: { theme: 'AI Visibility Score Wednesdays', pillar: 'geo' }, // Wednesday
  4: { theme: 'AEO & Featured Snippets Thursdays', pillar: 'aeo' }, // Thursday
  5: { theme: 'Content Strategy & E-E-A-T Fridays', pillar: 'seo' }, // Friday
  6: { theme: 'Product Updates & Case Studies', pillar: 'all' }, // Saturday
  7: { theme: 'Weekly Roundup / Newsletter', pillar: 'all' },   // Sunday
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface GenerateCalendarBody {
  days?: number      // Number of days to generate (default 7)
  startDate?: string // ISO date string (default: today)
}

interface UpdateCalendarBody {
  id: string
  status?: string
  briefId?: string
  articleId?: string
  notes?: string
  theme?: string
}

// ── GET: Calendar entries for date range ──────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Default to current week
    const fromDate = from ? new Date(from) : new Date()
    const toDate = to ? new Date(to) : new Date(fromDate.getTime() + 14 * 24 * 60 * 60 * 1000)

    fromDate.setHours(0, 0, 0, 0)
    toDate.setHours(23, 59, 59, 999)

    const entries = await db.editorialCalendarEntry.findMany({
      where: {
        domain,
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: { date: 'asc' },
      include: {
        // Include linked brief and article if they exist via the IDs
      },
    })

    // Enrich with brief/article data
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        const [brief, article] = await Promise.all([
          entry.briefId
            ? db.contentBrief.findUnique({ where: { id: entry.briefId }, select: { id: true, topic: true, pillar: true, status: true } })
            : null,
          entry.articleId
            ? db.contentArticle.findUnique({ where: { id: entry.articleId }, select: { id: true, title: true, format: true, status: true } })
            : null,
        ])
        return { ...entry, brief, article }
      })
    )

    return NextResponse.json({ entries: enriched, from: fromDate, to: toDate })
  } catch (error) {
    console.error('[Content Engine Editorial Calendar] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch editorial calendar' },
      { status: 500 }
    )
  }
}

// ── POST: Generate calendar entries ───────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateCalendarBody
    const domain = DEFAULT_DOMAIN
    const days = body.days || 7
    const startDate = body.startDate ? new Date(body.startDate) : new Date()
    startDate.setHours(0, 0, 0, 0)

    const created: Array<{
      id: string
      date: Date
      dayOfWeek: number
      theme: string
      status: string
    }> = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)

      // JS getDay(): 0=Sunday, 1=Monday...6=Saturday
      // Our schema: 1=Monday, 7=Sunday
      const jsDay = date.getDay()
      const dayOfWeek = jsDay === 0 ? 7 : jsDay

      const weekTheme = WEEKLY_THEMES[dayOfWeek]
      if (!weekTheme) continue

      // Use upsert to avoid duplicates (unique constraint on domain+date)
      const entry = await db.editorialCalendarEntry.upsert({
        where: { domain_date: { domain, date } },
        create: {
          domain,
          date,
          dayOfWeek,
          theme: weekTheme.theme,
          status: 'scheduled',
        },
        update: {
          theme: weekTheme.theme,
        },
      })

      created.push(entry)
    }

    return NextResponse.json({
      message: `Generated ${created.length} calendar entries`,
      entries: created,
    }, { status: 201 })
  } catch (error) {
    console.error('[Content Engine Editorial Calendar] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate editorial calendar' },
      { status: 500 }
    )
  }
}

// ── PUT: Update a calendar entry ──────────────────────────────────────────────

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateCalendarBody

    if (!body.id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const existing = await db.editorialCalendarEntry.findUnique({
      where: { id: body.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Calendar entry not found' },
        { status: 404 }
      )
    }

    const validStatuses = ['scheduled', 'brief_generated', 'writing', 'review', 'published', 'skipped']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.briefId !== undefined) updateData.briefId = body.briefId
    if (body.articleId !== undefined) updateData.articleId = body.articleId
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.theme !== undefined) updateData.theme = body.theme

    const entry = await db.editorialCalendarEntry.update({
      where: { id: body.id },
      data: updateData,
    })

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('[Content Engine Editorial Calendar] PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar entry' },
      { status: 500 }
    )
  }
}
