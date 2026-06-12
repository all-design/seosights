/**
 * Admin API — Client Zero Management
 *
 * GET  /api/admin/client-zero        — List all Client Zero projects with stats
 * POST /api/admin/client-zero        — Create or mark a project as Client Zero
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: List all Client Zero projects ────────────────────────────────────────

export async function GET() {
  try {
    const projects = await db.project.findMany({
      where: { isInternalAutopilot: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: {
            contentQueue: true,
            outreachLogs: true,
          },
        },
      },
    })

    // Enrich with content queue stats and outreach stats
    const enriched = await Promise.all(
      projects.map(async (project) => {
        const [pendingContent, publishedContent, failedContent] = await Promise.all([
          db.internalContentQueue.count({
            where: { projectId: project.id, status: 'pending' },
          }),
          db.internalContentQueue.count({
            where: { projectId: project.id, status: 'published' },
          }),
          db.internalContentQueue.count({
            where: { projectId: project.id, status: 'failed' },
          }),
        ])

        const [pendingOutreach, sentOutreach, repliedOutreach, linkAcquiredOutreach] =
          await Promise.all([
            db.outreachLog.count({
              where: { projectId: project.id, status: 'pending' },
            }),
            db.outreachLog.count({
              where: { projectId: project.id, status: 'sent' },
            }),
            db.outreachLog.count({
              where: { projectId: project.id, status: 'replied' },
            }),
            db.outreachLog.count({
              where: { projectId: project.id, status: 'link_acquired' },
            }),
          ])

        return {
          id: project.id,
          url: project.url,
          domain: project.domain,
          cmsPlatform: project.cmsPlatform,
          autopilotPostsPerMonth: project.autopilotPostsPerMonth,
          lastAnalysisAt: project.lastAnalysisAt,
          createdAt: project.createdAt,
          user: project.user,
          contentQueue: {
            total: project._count.contentQueue,
            pending: pendingContent,
            published: publishedContent,
            failed: failedContent,
          },
          outreach: {
            total: project._count.outreachLogs,
            pending: pendingOutreach,
            sent: sentOutreach,
            replied: repliedOutreach,
            linkAcquired: linkAcquiredOutreach,
          },
        }
      })
    )

    return NextResponse.json({ projects: enriched })
  } catch (error) {
    console.error('[Admin Client Zero API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Client Zero projects' },
      { status: 500 }
    )
  }
}

// ── POST: Create or mark a project as Client Zero ─────────────────────────────

interface CreateClientZeroBody {
  projectId?: string
  url?: string
  domain?: string
  postsPerMonth?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateClientZeroBody

    // Check Client Zero project limit
    const existingCount = await db.project.count({
      where: { isInternalAutopilot: true },
    })

    if (existingCount >= 10) {
      return NextResponse.json(
        { error: 'Maximum 10 Client Zero projects allowed' },
        { status: 400 }
      )
    }

    if (body.projectId) {
      // Mark existing project as Client Zero
      const existingProject = await db.project.findUnique({
        where: { id: body.projectId },
      })

      if (!existingProject) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      if (existingProject.isInternalAutopilot) {
        return NextResponse.json(
          { error: 'Project is already a Client Zero project' },
          { status: 400 }
        )
      }

      const updated = await db.project.update({
        where: { id: body.projectId },
        data: {
          isInternalAutopilot: true,
          autopilotPostsPerMonth: body.postsPerMonth || 90,
          executionMode: 'auto-pilot',
        },
      })

      console.log(`[Client Zero] Marked project ${updated.id} (${updated.domain}) as Client Zero`)

      return NextResponse.json({
        message: 'Project marked as Client Zero',
        project: updated,
      })
    } else {
      // Create a new project as Client Zero
      if (!body.url) {
        return NextResponse.json(
          { error: 'URL is required when creating a new Client Zero project' },
          { status: 400 }
        )
      }

      const domain = body.domain || new URL(body.url).hostname

      // Need a userId — use a system user or first admin
      const adminUser = await db.user.findFirst({
        orderBy: { createdAt: 'asc' },
      })

      if (!adminUser) {
        return NextResponse.json(
          { error: 'No admin user found. Create a user first.' },
          { status: 400 }
        )
      }

      const newProject = await db.project.create({
        data: {
          userId: adminUser.id,
          url: body.url,
          domain,
          isInternalAutopilot: true,
          autopilotPostsPerMonth: body.postsPerMonth || 90,
          executionMode: 'auto-pilot',
        },
      })

      console.log(`[Client Zero] Created new project ${newProject.id} (${newProject.domain})`)

      return NextResponse.json({
        message: 'Client Zero project created',
        project: newProject,
      }, { status: 201 })
    }
  } catch (error) {
    console.error('[Admin Client Zero API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create Client Zero project' },
      { status: 500 }
    )
  }
}
