import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { agents } from '@/lib/agents'

export async function GET() {
  try {
    let prompts = await db.agentPrompt.findMany({
      orderBy: { agentId: 'asc' },
    })

    // If no prompts exist in DB, seed from agents.ts definitions
    if (prompts.length === 0) {
      for (const agent of agents) {
        await db.agentPrompt.create({
          data: {
            agentId: agent.id,
            agentName: agent.name,
            systemPrompt: agent.systemPrompt,
            userPromptTemplate: agent.buildUserPrompt({
              url: '{{url}}',
              domain: '{{domain}}',
              siteName: '{{siteName}}',
              siteContent: '{{siteContent}}',
              htmlStructure: '{{htmlStructure}}',
              competitorInfo: '{{competitorInfo}}',
              aiInfo: '{{aiInfo}}',
              localInfo: '{{localInfo}}',
              targetMarket: '{{targetMarket}}',
            }),
            model: 'default',
            fallbackModel: 'deepseek',
            isActive: true,
            version: 1,
          },
        })
      }
      prompts = await db.agentPrompt.findMany({
        orderBy: { agentId: 'asc' },
      })
    }

    return NextResponse.json({ prompts })
  } catch (error) {
    console.error('[Admin Prompts API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent prompts' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, systemPrompt, userPromptTemplate, model, fallbackModel, isActive } = body

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const existing = await db.agentPrompt.findUnique({
      where: { agentId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Agent prompt not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt
    if (userPromptTemplate !== undefined) updateData.userPromptTemplate = userPromptTemplate
    if (model !== undefined) updateData.model = model
    if (fallbackModel !== undefined) updateData.fallbackModel = fallbackModel
    if (isActive !== undefined) updateData.isActive = isActive
    updateData.version = existing.version + 1

    const updated = await db.agentPrompt.update({
      where: { agentId },
      data: updateData,
    })

    return NextResponse.json({ prompt: updated })
  } catch (error) {
    console.error('[Admin Prompts API] PUT Error:', error)
    return NextResponse.json(
      { error: 'Failed to update agent prompt' },
      { status: 500 }
    )
  }
}
