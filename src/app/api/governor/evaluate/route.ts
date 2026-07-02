/**
 * Governor Evaluate API — POST /api/governor/evaluate
 *
 * Body:
 *   {
 *     title:           string,
 *     description:     string,
 *     sourceEngine:    string,  // growth | product | architecture | engineering | tech-debt | documentation | observatory
 *     taskType:        string,  // feature | bugfix | refactor | docs | cleanup | test
 *     priority:        number,  // 1 (highest) - 5 (lowest)
 *     targetKPI?:       string,
 *     estimatedHours?: number
 *   }
 *
 * Calls `evaluateTask(proposal)` from `@/lib/ai-governor`.
 * Returns the GovernorDecision object.
 *
 * On LLM failure, the Governor internally falls back to rule-based evaluation,
 * so this endpoint always returns a decision (never 500 due to LLM issues).
 */

import { NextRequest, NextResponse } from 'next/server'
import { evaluateTask } from '@/lib/ai-governor'
import type { TaskProposal } from '@/lib/ai-governor'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const VALID_SOURCE_ENGINES = new Set([
  'growth',
  'product',
  'architecture',
  'engineering',
  'tech-debt',
  'documentation',
  'observatory',
])

const VALID_TASK_TYPES = new Set([
  'feature',
  'bugfix',
  'refactor',
  'docs',
  'cleanup',
  'test',
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      )
    }

    const {
      title,
      description,
      sourceEngine,
      taskType,
      priority,
      targetKPI,
      estimatedHours,
    } = body as Record<string, unknown>

    // ── Validate required fields ────────────────────────────────────────
    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Field "title" is required' },
        { status: 400 },
      )
    }

    if (typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Field "description" is required' },
        { status: 400 },
      )
    }

    if (typeof sourceEngine !== 'string' || !VALID_SOURCE_ENGINES.has(sourceEngine)) {
      return NextResponse.json(
        {
          error: `Field "sourceEngine" must be one of: ${Array.from(VALID_SOURCE_ENGINES).join(', ')}`,
        },
        { status: 400 },
      )
    }

    if (typeof taskType !== 'string' || !VALID_TASK_TYPES.has(taskType)) {
      return NextResponse.json(
        {
          error: `Field "taskType" must be one of: ${Array.from(VALID_TASK_TYPES).join(', ')}`,
        },
        { status: 400 },
      )
    }

    const priorityNum =
      typeof priority === 'number' ? priority : parseInt(String(priority), 10)
    if (Number.isNaN(priorityNum) || priorityNum < 1 || priorityNum > 5) {
      return NextResponse.json(
        { error: 'Field "priority" must be an integer between 1 and 5' },
        { status: 400 },
      )
    }

    // ── Optional fields ────────────────────────────────────────────────
    const proposal: TaskProposal = {
      title: title.trim(),
      description: description.trim(),
      sourceEngine,
      taskType,
      priority: priorityNum,
      targetKPI: typeof targetKPI === 'string' && targetKPI.trim() ? targetKPI.trim() : undefined,
      estimatedHours:
        typeof estimatedHours === 'number' && !Number.isNaN(estimatedHours)
          ? estimatedHours
          : undefined,
    }

    // ── Run Governor evaluation (LLM + rule-based fallback handled inside) ──
    const decision = await evaluateTask(proposal)

    return NextResponse.json(decision, { status: 200 })
  } catch (error) {
    console.error('[api/governor/evaluate] Failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        approved: false,
        confidence: 0,
        governorNotes: 'Governor evaluation failed unexpectedly.',
        decisionFramework: {
          solvesRealProblem: false,
          hasEvidence: false,
          fitsArchitecture: false,
          existingModuleSolves: false,
          improvesKPI: false,
          canMeasure: false,
        },
        impactScore: 0,
        interceptionId: `error-${Date.now()}`,
      },
      { status: 500 },
    )
  }
}
