import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { stepId } = body

    if (!stepId) {
      return NextResponse.json({ error: 'stepId is required' }, { status: 400 })
    }

    // Verify the mission exists and is active
    const mission = await db.engagementMission.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    })

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    if (mission.status !== 'active') {
      return NextResponse.json({ error: 'Mission is not active' }, { status: 400 })
    }

    // Verify the step belongs to this mission
    const step = await db.engagementMissionStep.findFirst({
      where: { id: stepId, missionId: id },
    })

    if (!step) {
      return NextResponse.json({ error: 'Step not found in this mission' }, { status: 404 })
    }

    if (step.isCompleted) {
      return NextResponse.json({ error: 'Step already completed' }, { status: 400 })
    }

    // Mark the step as complete
    await db.engagementMissionStep.update({
      where: { id: stepId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    })

    // Check if all steps are now complete
    const completedCount = mission.steps.filter(
      (s) => s.isCompleted || s.id === stepId
    ).length
    const allDone = completedCount >= mission.totalSteps

    if (allDone) {
      // Mark the mission as completed
      await db.engagementMission.update({
        where: { id },
        data: {
          completedSteps: mission.totalSteps,
          status: 'completed',
          completedAt: new Date(),
        },
      })
    } else {
      // Increment completed steps counter
      await db.engagementMission.update({
        where: { id },
        data: {
          completedSteps: completedCount,
        },
      })
    }

    // Fetch updated mission with steps
    const updatedMission = await db.engagementMission.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    })

    return NextResponse.json({
      mission: updatedMission,
      allCompleted: allDone,
    })
  } catch (error) {
    console.error('[engagement/missions/complete] Error:', error)
    return NextResponse.json({ error: 'Failed to complete step' }, { status: 500 })
  }
}
