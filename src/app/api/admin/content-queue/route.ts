/**
 * Admin API — Internal Content Queue Management
 *
 * GET  /api/admin/content-queue       — List content queue entries (filterable)
 * POST /api/admin/content-queue       — Generate 90 content topics for a Client Zero project
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContentTopics } from '@/lib/client-zero-topics'

// ── GET: List content queue entries ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || undefined
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status

    const [entries, total] = await Promise.all([
      db.internalContentQueue.findMany({
        where,
        orderBy: { scheduledFor: 'asc' },
        take: limit,
        skip: offset,
        include: {
          project: {
            select: {
              id: true,
              domain: true,
              url: true,
              cmsPlatform: true,
            },
          },
        },
      }),
      db.internalContentQueue.count({ where }),
    ])

    return NextResponse.json({ entries, total })
  } catch (error) {
    console.error('[Admin Content Queue API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content queue entries' },
      { status: 500 }
    )
  }
}

// ── POST: Generate 90 content topics for a Client Zero project ────────────────

interface GenerateTopicsBody {
  projectId: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateTopicsBody

    if (!body.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    // Verify the project exists and is a Client Zero project
    const project = await db.project.findUnique({
      where: { id: body.projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.isInternalAutopilot) {
      return NextResponse.json(
        { error: 'Project is not a Client Zero project' },
        { status: 400 }
      )
    }

    // Generate 90 topics from our predefined list
    const topics = generateContentTopics()

    // Schedule across 30 days, 3 per day at 09:00, 13:00, 18:00
    const dailySlots = [9, 13, 18] // hours
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() + 1) // Start from tomorrow
    startDate.setHours(0, 0, 0, 0)

    const queueEntries = topics.map((topic, index) => {
      const dayOffset = Math.floor(index / 3) // 0-29 (30 days)
      const slotIndex = index % 3 // 0, 1, or 2 (three slots per day)

      const scheduledFor = new Date(startDate)
      scheduledFor.setDate(scheduledFor.getDate() + dayOffset)
      scheduledFor.setHours(dailySlots[slotIndex], 0, 0, 0)

      return {
        projectId: body.projectId,
        keywordTarget: topic.keywordTarget,
        suggestedTitle: topic.suggestedTitle,
        pillar: topic.pillar,
        cluster: topic.cluster,
        status: 'pending' as const,
        scheduledFor,
      }
    })

    // Create all 90 entries in bulk
    const result = await db.internalContentQueue.createMany({
      data: queueEntries,
    })

    console.log(
      `[Content Queue] Created ${result.count} content queue entries for project ${project.domain}`
    )

    return NextResponse.json({
      message: `Generated ${result.count} content topics for ${project.domain}`,
      count: result.count,
      projectId: body.projectId,
      scheduledRange: {
        from: queueEntries[0]?.scheduledFor,
        to: queueEntries[queueEntries.length - 1]?.scheduledFor,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Admin Content Queue API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content topics' },
      { status: 500 }
    )
  }
}
