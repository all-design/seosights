/**
 * Admin API — Individual Client Zero Project Management
 *
 * GET    /api/admin/client-zero/[projectId]  — Get detailed stats for a Client Zero project
 * DELETE /api/admin/client-zero/[projectId]  — Remove Client Zero status
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET: Get detailed stats for a specific Client Zero project ────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
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

    // Content queue counts by status
    const [pendingQueue, generatingQueue, publishedQueue, failedQueue, totalQueue] =
      await Promise.all([
        db.internalContentQueue.count({
          where: { projectId, status: 'pending' },
        }),
        db.internalContentQueue.count({
          where: { projectId, status: 'generating' },
        }),
        db.internalContentQueue.count({
          where: { projectId, status: 'published' },
        }),
        db.internalContentQueue.count({
          where: { projectId, status: 'failed' },
        }),
        db.internalContentQueue.count({
          where: { projectId },
        }),
      ])

    // Outreach counts by status
    const [pendingOutreach, sentOutreach, repliedOutreach, linkAcquiredOutreach, failedOutreach, totalOutreach] =
      await Promise.all([
        db.outreachLog.count({
          where: { projectId, status: 'pending' },
        }),
        db.outreachLog.count({
          where: { projectId, status: 'sent' },
        }),
        db.outreachLog.count({
          where: { projectId, status: 'replied' },
        }),
        db.outreachLog.count({
          where: { projectId, status: 'link_acquired' },
        }),
        db.outreachLog.count({
          where: { projectId, status: 'failed' },
        }),
        db.outreachLog.count({
          where: { projectId },
        }),
      ])

    // Posts published this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const postsPublishedThisMonth = await db.internalContentQueue.count({
      where: {
        projectId,
        status: 'published',
        publishedAt: { gte: startOfMonth },
      },
    })

    // CMS publish logs this month
    const cmsPublishesThisMonth = await db.cMSPublishLog.count({
      where: {
        projectId,
        status: 'published',
        publishedAt: { gte: startOfMonth },
      },
    })

    // Content queue by cluster
    const queueByCluster = await db.internalContentQueue.groupBy({
      by: ['cluster'],
      where: { projectId },
      _count: { id: true },
    })

    // Content queue by pillar
    const queueByPillar = await db.internalContentQueue.groupBy({
      by: ['pillar'],
      where: { projectId },
      _count: { id: true },
    })

    return NextResponse.json({
      project: {
        id: project.id,
        url: project.url,
        domain: project.domain,
        cmsPlatform: project.cmsPlatform,
        autopilotPostsPerMonth: project.autopilotPostsPerMonth,
        executionMode: project.executionMode,
        lastAnalysisAt: project.lastAnalysisAt,
        createdAt: project.createdAt,
        user: project.user,
      },
      contentQueue: {
        total: totalQueue,
        pending: pendingQueue,
        generating: generatingQueue,
        published: publishedQueue,
        failed: failedQueue,
        postsPublishedThisMonth,
        cmsPublishesThisMonth,
        byCluster: queueByCluster.map((c) => ({
          cluster: c.cluster,
          count: c._count.id,
        })),
        byPillar: queueByPillar.map((p) => ({
          pillar: p.pillar,
          count: p._count.id,
        })),
      },
      outreach: {
        total: totalOutreach,
        pending: pendingOutreach,
        sent: sentOutreach,
        replied: repliedOutreach,
        linkAcquired: linkAcquiredOutreach,
        failed: failedOutreach,
      },
    })
  } catch (error) {
    console.error('[Admin Client Zero Project API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project stats' },
      { status: 500 }
    )
  }
}

// ── DELETE: Remove Client Zero status ─────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    const project = await db.project.findUnique({
      where: { id: projectId },
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

    // Remove Client Zero status (does NOT delete the project or its content)
    const updated = await db.project.update({
      where: { id: projectId },
      data: {
        isInternalAutopilot: false,
        autopilotPostsPerMonth: 0,
        executionMode: 'co-pilot', // Revert to co-pilot mode
      },
    })

    console.log(`[Client Zero] Removed Client Zero status from project ${updated.id} (${updated.domain})`)

    return NextResponse.json({
      message: 'Client Zero status removed from project',
      project: {
        id: updated.id,
        domain: updated.domain,
        isInternalAutopilot: updated.isInternalAutopilot,
      },
    })
  } catch (error) {
    console.error('[Admin Client Zero Project API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to remove Client Zero status' },
      { status: 500 }
    )
  }
}
