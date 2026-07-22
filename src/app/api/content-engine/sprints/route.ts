/**
 * Sprints — Autonomous Goal-Driven Sprints
 *
 * GET  /api/content-engine/sprints  → List sprints
 * POST /api/content-engine/sprints  → Create a new sprint (with AI planning)
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeLLM } from '@/lib/ai-router'

const DEFAULT_DOMAIN = 'seosights.com'

// ── GET: List Sprints ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') || DEFAULT_DOMAIN
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { domain }
    if (status) where.status = status

    const sprints = await db.sprint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with progress percentage
    const enriched = sprints.map((s) => ({
      ...s,
      progressPercentage: s.totalActions > 0
        ? Math.round((s.executedActions / s.totalActions) * 100)
        : 0,
      aiPlanParsed: s.aiPlan ? JSON.parse(s.aiPlan) : null,
      plannedActionsParsed: s.plannedActions ? JSON.parse(s.plannedActions) : null,
      resultSummaryParsed: s.resultSummary ? JSON.parse(s.resultSummary) : null,
    }))

    return NextResponse.json({
      sprints: enriched,
      total: sprints.length,
    })
  } catch (error) {
    console.error('[Sprints] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprints' },
      { status: 500 }
    )
  }
}

// ── POST: Create Sprint ───────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const domain = body?.domain || DEFAULT_DOMAIN
    const { goal, goalMetric, goalTarget, autoPlan } = body

    // Get next sprint number
    const lastSprint = await db.sprint.findFirst({
      where: { domain },
      orderBy: { sprintNumber: 'desc' },
      select: { sprintNumber: true },
    })
    const sprintNumber = (lastSprint?.sprintNumber ?? 0) + 1

    // Get current visibility state
    const [latestVisibility, recentMemories, activeSprints, topEvidence] =
      await Promise.all([
        db.visibilitySnapshot.findFirst({
          where: { domain },
          orderBy: { capturedAt: 'desc' },
        }),
        db.growthMemory.findMany({
          where: { domain, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        db.sprint.findMany({
          where: { domain, status: { in: ['planning', 'active'] } },
        }),
        db.evidenceEntry.findMany({
          where: { domain, confidence: { gte: 60 } },
          orderBy: { confidence: 'desc' },
          take: 5,
        }),
      ])

    const currentVisibility = latestVisibility?.overallScore ?? 0

    let sprintGoal: string
    let sprintMetric: string
    let sprintTarget: number
    let sprintPlan: Record<string, unknown>
    let sprintPlannedActions: Array<Record<string, unknown>>

    if (autoPlan) {
      // Fully autonomous: AI determines the goal and plan
      const systemPrompt = `You are an AI Growth Strategist creating an autonomous sprint plan for "${domain}".

Current state:
- AI Visibility Score: ${currentVisibility}/100
- Active sprints: ${activeSprints.length}
- Recent actions (30d): ${recentMemories.length}
- Top action types: ${getTopActionTypes(recentMemories)}
- Best evidence: ${topEvidence.map(e => `${e.recommendationType} (${e.confidence}% confidence, +${e.avgVisibilityGain} avg)`).join(', ')}

Generate a focused 2-week sprint plan. Format as JSON:
{
  "goal": "string (e.g. '+10 AI Visibility')",
  "goalMetric": "ai_visibility",
  "goalTarget": number,
  "plan": {
    "articles": [{ "topic": "string", "pillar": "seo|aeo|geo", "keyword": "string" }],
    "faqs": [{ "question": "string", "targetPage": "string" }],
    "schemas": [{ "type": "string", "targetPage": "string" }],
    "internalLinks": number,
    "technicalFixes": ["string"],
    "entityPages": ["string"]
  },
  "plannedActions": [
    { "action": "string", "type": "string", "estimatedImpact": "string", "effort": "string", "order": number }
  ],
  "estimatedDuration": "14 days",
  "estimatedVisibilityGain": number
}

Make the plan specific, actionable, and realistic. Target the highest-impact, lowest-effort actions first.`

      try {
        const aiResult = await routeLLM([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Create the sprint plan.' },
        ], { taskType: 'strategy', temperature: 0.7 })

        const parsed = JSON.parse(aiResult.content)
        sprintGoal = parsed.goal
        sprintMetric = parsed.goalMetric
        sprintTarget = parsed.goalTarget
        sprintPlan = parsed.plan
        sprintPlannedActions = parsed.plannedActions
      } catch {
        // Fallback plan
        const targetGain = Math.max(5, Math.round((80 - currentVisibility) * 0.15))
        sprintGoal = `+${targetGain} AI Visibility`
        sprintMetric = 'ai_visibility'
        sprintTarget = currentVisibility + targetGain
        sprintPlan = {
          articles: [
            { topic: 'Entity SEO Guide for AI Visibility', pillar: 'seo', keyword: 'entity seo' },
            { topic: 'How to Optimize for Claude and Perplexity', pillar: 'geo', keyword: 'claude seo' },
            { topic: 'AI Visibility for Dentists: Complete Guide', pillar: 'geo', keyword: 'ai visibility dentists' },
          ],
          faqs: [
            { question: 'What is AI Visibility Score?', targetPage: '/features/ai-visibility-score' },
            { question: 'How does GEO differ from AEO?', targetPage: '/blog/geo-vs-aeo' },
          ],
          schemas: [{ type: 'FAQPage', targetPage: '/blog' }],
          internalLinks: 5,
          technicalFixes: ['Update llms.txt with new articles'],
          entityPages: ['Seosights Wikipedia citation source'],
        }
        sprintPlannedActions = [
          { action: 'Publish "Entity SEO Guide for AI Visibility"', type: 'content', estimatedImpact: '+4 AI Visibility', effort: '30 min', order: 1 },
          { action: 'Publish "How to Optimize for Claude and Perplexity"', type: 'content', estimatedImpact: '+3 AI Visibility', effort: '30 min', order: 2 },
          { action: 'Add FAQ schema to top 3 articles', type: 'schema', estimatedImpact: '+2 AI Visibility', effort: '15 min', order: 3 },
          { action: 'Add 5 internal links from high-authority pages', type: 'link', estimatedImpact: '+2 AI Visibility', effort: '20 min', order: 4 },
          { action: 'Publish "AI Visibility for Dentists" guide', type: 'content', estimatedImpact: '+3 AI Visibility', effort: '30 min', order: 5 },
          { action: 'Create Wikipedia citation source for Seosights', type: 'entity', estimatedImpact: '+2 AI Visibility', effort: '60 min', order: 6 },
          { action: 'Update llms.txt with all new articles', type: 'technical', estimatedImpact: '+1 AI Visibility', effort: '10 min', order: 7 },
        ]
      }
    } else {
      // Manual: user provides goal
      if (!goal) {
        return NextResponse.json(
          { error: 'goal is required (or set autoPlan: true)' },
          { status: 400 }
        )
      }

      sprintGoal = goal
      sprintMetric = goalMetric || 'ai_visibility'
      sprintTarget = goalTarget ?? (currentVisibility + 10)

      // Generate plan for user-specified goal
      const systemPrompt = `You are an AI Growth Strategist. Create a specific action plan for this sprint goal: "${goal}".

Current AI Visibility: ${currentVisibility}/100
Target metric: ${sprintMetric}
Target value: ${sprintTarget}
Recent evidence: ${topEvidence.map(e => `${e.recommendationType} (${e.confidence}% conf)`).join(', ')}

Generate a JSON plan:
{
  "plan": {
    "articles": [{ "topic": "string", "pillar": "seo|aeo|geo", "keyword": "string" }],
    "faqs": [{ "question": "string", "targetPage": "string" }],
    "schemas": [{ "type": "string", "targetPage": "string" }],
    "internalLinks": number,
    "technicalFixes": ["string"],
    "entityPages": ["string"]
  },
  "plannedActions": [
    { "action": "string", "type": "string", "estimatedImpact": "string", "effort": "string", "order": number }
  ],
  "estimatedDuration": "14 days"
}`

      try {
        const aiResult = await routeLLM([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Create the sprint plan.' },
        ], { taskType: 'strategy', temperature: 0.7 })

        const parsed = JSON.parse(aiResult.content)
        sprintPlan = parsed.plan
        sprintPlannedActions = parsed.plannedActions
      } catch {
        sprintPlan = { articles: [], faqs: [], schemas: [], internalLinks: 0, technicalFixes: [], entityPages: [] }
        sprintPlannedActions = [{ action: goal, type: 'custom', estimatedImpact: 'TBD', effort: 'TBD', order: 1 }]
      }
    }

    const totalActions = sprintPlannedActions.length

    const sprint = await db.sprint.create({
      data: {
        domain,
        sprintNumber,
        goal: sprintGoal,
        goalMetric: sprintMetric,
        goalTarget: sprintTarget,
        currentValue: currentVisibility,
        status: 'planning',
        aiPlan: JSON.stringify(sprintPlan),
        plannedActions: JSON.stringify(sprintPlannedActions),
        totalActions,
        endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      },
    })

    return NextResponse.json({
      sprint: {
        ...sprint,
        aiPlanParsed: sprintPlan,
        plannedActionsParsed: sprintPlannedActions,
        progressPercentage: 0,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[Sprints] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create sprint' },
      { status: 500 }
    )
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function getTopActionTypes(memories: Array<{ actionType: string; visibilityDelta: number }>): string {
  const counts: Record<string, number> = {}
  for (const m of memories) {
    counts[m.actionType] = (counts[m.actionType] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => `${type} (${count})`)
    .join(', ')
}
