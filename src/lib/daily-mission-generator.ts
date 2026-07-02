/**
 * Daily Mission Generator — AI Software Factory™
 *
 * The Daily Mission is the autonomous engine's primary unit of work: each day,
 * the factory inspects the codebase, generates candidate improvement tasks,
 * evaluates each one through the AI Governor, and produces a DailyMission
 * record (with approved candidates attached as FactoryTask records).
 *
 * This module is shared between:
 *   - POST /api/factory/daily-mission  (manual trigger from dashboard)
 *   - GET  /api/cron/daily-mission     (Vercel Cron at 06:00)
 *
 * Budget constraints are conservative by default — we prefer fewer, higher-
 * confidence tasks over many low-confidence ones.
 *
 * Server-only module — no 'use client'.
 */

import { db } from './db'
import { scanCodebase, type ScanResult } from './codebase-scanner'
import { evaluateTask } from './ai-governor'
import type { TaskProposal, GovernorDecision } from './ai-governor'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MissionBudget {
  maxHours: number
  maxComponents: number
  maxPages: number
  confidenceThreshold: number
}

export interface GeneratedMission {
  missionId: string
  date: Date
  goal: string
  strategy: string
  budget: MissionBudget
  candidatesEvaluated: number
  candidatesApproved: number
  candidatesRejected: number
  approvedTasks: Array<{
    title: string
    description: string
    sourceEngine: string
    taskType: string
    priority: number
    confidence: number
    impactScore: number
    targetKPI?: string
    estimatedHours: number
  }>
  decisions: GovernorDecision[]
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_GOAL = 'Increase platform value through highest-impact improvement'
const DEFAULT_STRATEGY =
  'Scan the codebase, surface documentation / QA / cleanup gaps, evaluate each through the Governor, and ship the highest-confidence improvements within budget.'

export const DEFAULT_BUDGET: MissionBudget = {
  maxHours: 4,
  maxComponents: 2,
  maxPages: 5,
  confidenceThreshold: 0.8,
}

// ─── Candidate Generation ─────────────────────────────────────────────────────

/**
 * Build a list of candidate task proposals from a codebase scan.
 *
 * Strategy:
 *   - Documentation engine  → "Add module-level docs to <lib>" for libs with
 *                              low doc-to-code ratio
 *   - Documentation engine  → "Document API route <path>" for any API route
 *   - Tech-debt engine      → "Refactor oversized component <name>" (>400 LOC)
 *   - Engineering engine    → "Add tests for hook <name>" for each hook
 *   - Architecture engine   → "Audit auth coverage on API route <path>"
 *
 * The list is capped to a sensible maximum (8 candidates) so the Governor
 * evaluation stays fast even on slow LLMs.
 */
export function generateCandidates(scan: ScanResult): TaskProposal[] {
  const candidates: TaskProposal[] = []

  // 1. Document API routes (rule: never_reduce_documentation)
  for (const route of scan.apiRoutes.slice(0, 4)) {
    candidates.push({
      title: `Document API route ${route.path}`,
      description:
        `Add a JSDoc header + request/response examples to ${route.file}. ` +
        `The route currently has ${route.lineCount} lines and ` +
        `${route.hasAuth ? 'auth guards present' : 'NO auth guards detected'}. ` +
        `Documentation coverage is required by the Constitution (never_reduce_documentation).`,
      sourceEngine: 'documentation',
      taskType: 'docs',
      priority: 2,
      targetKPI: 'documentation_coverage',
      estimatedHours: 0.5,
    })
  }

  // 2. Refactor oversized components (>400 LOC) — tech debt
  for (const comp of scan.components.slice(0, 6)) {
    if (comp.lineCount > 400) {
      candidates.push({
        title: `Refactor oversized component ${comp.name} (${comp.lineCount} LOC)`,
        description:
          `Component ${comp.name} at ${comp.path} has ${comp.lineCount} lines — exceeds the ` +
          `400-line maintainability threshold. Split into smaller sub-components, extract hooks, ` +
          `and reduce cognitive load. Improves developer velocity (measured by review time).`,
        sourceEngine: 'tech-debt',
        taskType: 'refactor',
        priority: 3,
        targetKPI: 'maintainability_score',
        estimatedHours: 2,
      })
    }
  }

  // 3. Add tests for hooks — engineering
  for (const hook of scan.hooks.slice(0, 3)) {
    candidates.push({
      title: `Add tests for hook ${hook.name}`,
      description:
        `Hook ${hook.name} at ${hook.path} has no test coverage. Add unit tests covering ` +
        `the happy path + edge cases. Exports: ${hook.exports.join(', ') || '(none detected)'}. ` +
        `Improves QA coverage (Constitution rule: never_reduce_qa).`,
      sourceEngine: 'engineering',
      taskType: 'test',
      priority: 3,
      targetKPI: 'qa_pass_rate',
      estimatedHours: 1,
    })
  }

  // 4. Audit auth coverage on unprotected API routes — architecture
  const unprotectedRoutes = scan.apiRoutes.filter((r) => !r.hasAuth).slice(0, 2)
  for (const route of unprotectedRoutes) {
    candidates.push({
      title: `Audit auth on API route ${route.path}`,
      description:
        `API route ${route.path} (${route.file}) has no detected auth guard. ` +
        `Determine whether it should be public or protected. If protected, add NextAuth ` +
        `or superadmin gate. Reduces security surface area — measured by audit findings.`,
      sourceEngine: 'architecture',
      taskType: 'bugfix',
      priority: 2,
      targetKPI: 'security_audit_findings',
      estimatedHours: 0.5,
    })
  }

  // 5. Documentation drift — check large libs without JSDoc
  for (const lib of scan.libs.slice(0, 3)) {
    // Heuristic: a "documented" file typically has JSDoc /** ... */ blocks.
    // We don't have access to the raw content here, so we use line count
    // as a proxy for "is this file large enough to warrant docs?"
    if (lib.lineCount > 200) {
      candidates.push({
        title: `Add module-level documentation to ${lib.name}`,
        description:
          `Library module ${lib.name} at ${lib.path} has ${lib.lineCount} lines but lacks ` +
          `a comprehensive module-level JSDoc explaining its purpose, public API, and ` +
          `usage examples. Exports: ${lib.exports.slice(0, 5).join(', ')}. ` +
          `Improves developer onboarding velocity.`,
        sourceEngine: 'documentation',
        taskType: 'docs',
        priority: 4,
        targetKPI: 'documentation_coverage',
        estimatedHours: 0.5,
      })
    }
  }

  // Cap to keep LLM evaluation cost predictable
  return candidates.slice(0, 8)
}

// ─── Mission Generation ───────────────────────────────────────────────────────

/**
 * Generate (and persist) today's Daily Mission.
 *
 * Flow:
 *   1. Scan the codebase (current state, in-memory only — no snapshot saved)
 *   2. Generate candidate task proposals from the scan
 *   3. Evaluate each candidate through the AI Governor (LLM + rule-based fallback)
 *   4. Filter approved candidates that meet the confidence threshold + budget
 *   5. Create a DailyMission record (status='active')
 *   6. For each approved candidate, the Governor already created a FactoryTask
 *      (with status='approved'); we link them to this mission via missionId
 *   7. Return the generated mission summary
 *
 * Budget enforcement:
 *   - Only candidates with `confidence >= confidenceThreshold` are accepted
 *   - Total `estimatedHours` of approved candidates ≤ `maxHours`
 *   - Number of approved candidates ≤ `maxComponents + maxPages`
 */
export async function generateDailyMission(
  budget: MissionBudget = DEFAULT_BUDGET,
  goal: string = DEFAULT_GOAL,
  strategy: string = DEFAULT_STRATEGY,
): Promise<GeneratedMission> {
  // ── Step 0: Clean up old FactoryTasks from today's previous run ──
  // This MUST run BEFORE candidate evaluation (Step 3) — otherwise the
  // Governor's evaluateTask() would create new FactoryTasks during Step 3,
  // and this dedup would immediately delete them.
  //
  // We delete by createdAt >= today midnight (not by missionId) because the
  // Governor creates FactoryTasks with missionId = null when a task is
  // approved-but-below-mission-confidence-threshold. Those orphan tasks would
  // never be re-linked to a new mission, so we'd accumulate them forever.
  const today = new Date()
  today.setHours(0, 0, 0, 0) // normalize to midnight for unique date matching

  try {
    const deleted = await db.factoryTask.deleteMany({
      where: { createdAt: { gte: today } },
    })
    if (deleted.count > 0) {
      console.log(
        `[daily-mission] Cleaned up ${deleted.count} old FactoryTask(s) from previous run(s) today`,
      )
    }
  } catch (err) {
    console.warn(
      '[daily-mission] Could not clean up old FactoryTasks (continuing):',
      err,
    )
  }

  // ── Step 1: Scan ──
  const scan = await scanCodebase()

  // ── Step 2: Generate candidates ──
  const candidates = generateCandidates(scan)

  // ── Step 3: Evaluate each through the Governor ──
  // evaluateTask() will create GovernorInterception + FactoryTask records
  // for each approved candidate. The dedup in Step 0 already cleared the
  // slate, so these are all fresh.
  const decisions: GovernorDecision[] = []
  for (const proposal of candidates) {
    try {
      const decision = await evaluateTask(proposal)
      decisions.push(decision)
    } catch (err) {
      console.error(
        `[daily-mission] Governor evaluation failed for "${proposal.title}":`,
        err,
      )
    }
  }

  // ── Step 4: Filter approved candidates meeting budget ──
  const approvedProposals: Array<{
    proposal: TaskProposal
    decision: GovernorDecision
  }> = []

  let hoursBudgeted = 0
  const maxApprovedCount = budget.maxComponents + budget.maxPages

  for (let i = 0; i < candidates.length; i++) {
    const proposal = candidates[i]
    const decision = decisions[i]
    if (!decision) continue

    if (
      decision.approved &&
      decision.confidence >= budget.confidenceThreshold
    ) {
      const est = proposal.estimatedHours ?? 0
      // Check budget headroom BEFORE adding — once we hit the limit, stop
      if (hoursBudgeted + est > budget.maxHours) continue
      if (approvedProposals.length >= maxApprovedCount) break

      approvedProposals.push({ proposal, decision })
      hoursBudgeted += est
    }
  }

  // ── Step 5: Create DailyMission record ──
  // `today` was already normalized to midnight in Step 0 (above). Reusing it
  // here avoids re-creating a Date object with the same value.
  let missionId = ''

  try {
    // Use upsert so a re-run on the same day replaces (not duplicates) the mission
    const mission = await db.dailyMission.upsert({
      where: { date: today },
      create: {
        date: today,
        goal,
        strategy,
        maxHours: budget.maxHours,
        maxComponents: budget.maxComponents,
        maxPages: budget.maxPages,
        confidenceThreshold: budget.confidenceThreshold,
        hoursUsed: hoursBudgeted,
        componentsCreated: approvedProposals.length,
        pagesCreated: 0,
        status: 'active',
        candidatesEvaluated: candidates.length,
        candidatesApproved: approvedProposals.length,
        candidatesRejected: Math.max(0, candidates.length - approvedProposals.length),
      },
      update: {
        goal,
        strategy,
        maxHours: budget.maxHours,
        maxComponents: budget.maxComponents,
        maxPages: budget.maxPages,
        confidenceThreshold: budget.confidenceThreshold,
        hoursUsed: hoursBudgeted,
        componentsCreated: approvedProposals.length,
        pagesCreated: 0,
        status: 'active',
        candidatesEvaluated: candidates.length,
        candidatesApproved: approvedProposals.length,
        candidatesRejected: Math.max(0, candidates.length - approvedProposals.length),
      },
    })
    missionId = mission.id
  } catch (err) {
    console.error('[daily-mission] Failed to persist DailyMission:', err)
    // Continue — we still return a summary, just without DB-persisted mission
  }

  // ── Step 6: Link approved FactoryTasks to this mission ──
  // The Governor already created FactoryTask rows for each approved proposal.
  // We need to update them with the missionId so the dashboard can join.
  if (missionId) {
    for (const { proposal, decision } of approvedProposals) {
      if (!decision.interceptionId) continue
      try {
        // Find the FactoryTask that was created during evaluateTask by matching
        // on the governorInterception's taskId
        const interception = await db.governorInterception.findUnique({
          where: { id: decision.interceptionId },
          select: { taskId: true },
        })
        if (interception?.taskId) {
          await db.factoryTask.update({
            where: { id: interception.taskId },
            data: { missionId },
          })
        }
      } catch (err) {
        console.warn(
          `[daily-mission] Could not link FactoryTask to mission for "${proposal.title}":`,
          err,
        )
      }
    }
  }

  // ── Step 7: Build the summary ──
  return {
    missionId,
    date: today,
    goal,
    strategy,
    budget,
    candidatesEvaluated: candidates.length,
    candidatesApproved: approvedProposals.length,
    candidatesRejected: Math.max(0, candidates.length - approvedProposals.length),
    approvedTasks: approvedProposals.map(({ proposal, decision }) => ({
      title: proposal.title,
      description: proposal.description,
      sourceEngine: proposal.sourceEngine,
      taskType: proposal.taskType,
      priority: proposal.priority,
      confidence: decision.confidence,
      impactScore: decision.impactScore,
      targetKPI: proposal.targetKPI,
      estimatedHours: proposal.estimatedHours ?? 0,
    })),
    decisions,
  }
}
