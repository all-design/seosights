/**
 * AI Governor™ — The Constitution Enforcer
 * ====================================================
 *
 * The AI Governor evaluates every proposed task through the Decision Framework
 * using the AI Router for LLM-backed reasoning. It is the gatekeeper between
 * the autonomous engines (growth / product / architecture / engineering /
 * tech-debt / documentation) and the production codebase.
 *
 * ─── System Directive ──────────────────────────────────────────────────────
 * "Every task must justify its existence against the Constitution. If a task
 * cannot answer the 6 Decision Framework questions with evidence, it is
 * rejected — no exceptions, no overrides, no 'just this once'."
 *
 * ─── 7 Golden Rules ─────────────────────────────────────────────────────────
 *   1. never_create_interesting       — only create with evidence
 *   2. never_duplicate_functionality — extend existing systems first
 *   3. never_publish_simulated       — no simulated research output
 *   4. never_reduce_documentation    — documentation coverage is sacred
 *   5. never_reduce_qa              — QA coverage is sacred
 *   6. never_reduce_observatory     — Observatory credibility is sacred
 *   7. never_push_to_production      — every change goes through PR
 *
 * ─── Decision Framework (6 Questions) ───────────────────────────────────────
 *   1. solvesRealProblem    — Does this solve a real problem?
 *   2. hasEvidence          — Is there evidence?
 *   3. fitsArchitecture     — Does it fit the architecture?
 *   4. existingModuleSolves — Can an existing module solve it?
 *   5. improvesKPI          — Will it improve a KPI?
 *   6. canMeasure           — Can it be measured?
 *   If ANY answer is NO → Reject the task.
 *
 * ─── Growth Priorities (1 = highest) ────────────────────────────────────────
 *   1. Activation          (free → first value)
 *   2. Retention           (first value → repeat value)
 *   3. Referral            (users → users)
 *   4. Revenue             (users → MRR)
 *   5. Cost Reduction      (lower CAC / infra)
 *
 * Server-only module — no 'use client'.
 *
 * ─── In-Memory LLM Decision Cache ───────────────────────────────────────────
 * Why:    deduplicate LLM calls when the Daily Mission generator re-runs and
 *         re-evaluates identical task proposals (same title/description/
 *         sourceEngine/taskType/priority/targetKPI/estimatedHours). A repeat
 *         evaluation returns the cached GovernorDecision instead of calling
 *         routeLLM() again — saving tokens, latency, and rate-limit budget.
 * TTL:    30 minutes (entries older than 30 min are treated as misses).
 * Scope:  per-process, in-memory only — NOT persisted across server restarts
 *         and NOT shared across server instances. Safe because Daily Mission
 *         runs are rare, short-lived, and idempotent within a single process.
 */

import { createHash } from 'crypto'
import { routeLLM } from './ai-router'
import { extractJsonObject } from './llm-utils'
import { db } from './db'

// ─────────────────────────────────────────────────────────────────────────────
// Public Types
// ─────────────────────────────────────────────────────────────────────────────

export type SourceEngine =
  | 'growth'
  | 'product'
  | 'architecture'
  | 'engineering'
  | 'tech-debt'
  | 'documentation'
  | 'observatory'

export type TaskTypeKind =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'docs'
  | 'cleanup'
  | 'test'

export interface TaskProposal {
  title: string
  description: string
  /** growth | product | architecture | engineering | tech-debt | documentation */
  sourceEngine: string
  /** feature | bugfix | refactor | docs | cleanup | test */
  taskType: string
  /** 1 (highest) - 5 (lowest) */
  priority: number
  targetKPI?: string
  estimatedHours?: number
}

export interface DecisionFramework {
  solvesRealProblem: boolean
  hasEvidence: boolean
  fitsArchitecture: boolean
  existingModuleSolves: boolean
  improvesKPI: boolean
  canMeasure: boolean
}

export interface GovernorDecision {
  approved: boolean
  confidence: number
  rejectionReason?: string
  governorNotes: string
  /** Which of the 7 Golden Rules was applied (e.g. "never_duplicate") */
  ruleApplied?: string
  decisionFramework: DecisionFramework
  /** 0-10 */
  impactScore: number
  interceptionId: string
}

export interface GovernorInterception {
  id: string
  taskId: string | null
  engineName: string
  proposedAction: string
  governorQuestion: string
  engineResponse: string
  /** approved | rejected | returned */
  outcome: string
  reasoning: string | null
  ruleApplied: string | null
  createdAt: Date
}

export interface GovernorStats {
  totalIntercepted: number
  totalApproved: number
  rejectionRate: number
  violationsPrevented: number
  recentInterceptions: GovernorInterception[]
}

/**
 * Convert a numeric priority (1–5) to the string expected by the FactoryTask
 * Prisma model.  Mapping: 1 → critical, 2 → high, 3 → medium, 4 → low, 5 → low.
 */
function priorityToString(priority: number): string {
  if (priority <= 1) return 'critical'
  if (priority === 2) return 'high'
  if (priority === 3) return 'medium'
  if (priority >= 4) return 'low'
  return 'medium' // fallback
}

/**
 * Map the Governor sourceEngine to the FactoryTask `type` field.
 * FactoryTask.type accepts: observation | product | architecture | engineering |
 * qa | review | security | performance | deploy | replay | learning
 */
function sourceEngineToFactoryType(sourceEngine: string): string {
  const map: Record<string, string> = {
    growth:         'observation',
    product:        'product',
    architecture:   'architecture',
    engineering:    'engineering',
    'tech-debt':    'review',
    documentation:  'review',
    observatory:    'observation',
  }
  return map[sourceEngine] || 'observation'
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory LLM Decision Cache
// (see header comment block for rationale, TTL, and scope)
// ─────────────────────────────────────────────────────────────────────────────

const parsedResponseCache = new Map<string, ParsedGovernorResponse>()
const cacheTimestamps = new Map<string, number>()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Compute a stable 16-char hash of the proposal's semantically-meaningful
 * fields. Two proposals with identical {title, description, sourceEngine,
 * taskType, priority, targetKPI, estimatedHours} produce the same hash, so a
 * re-evaluation hits the cache instead of calling routeLLM() again.
 */
function hashProposal(p: TaskProposal): string {
  const key = JSON.stringify({
    title: p.title,
    description: p.description,
    sourceEngine: p.sourceEngine,
    taskType: p.taskType,
    priority: p.priority,
    targetKPI: p.targetKPI ?? null,
    estimatedHours: p.estimatedHours ?? null,
  })
  return createHash('sha256').update(key).digest('hex').slice(0, 16)
}

/**
 * Clear the in-memory decision cache. Intended for tests and debugging —
 * production callers should never need this (TTL expiry is automatic).
 */
export function clearGovernorCache(): void {
  parsedResponseCache.clear()
  cacheTimestamps.clear()
}

// ─────────────────────────────────────────────────────────────────────────────
// Constitution Prompts (English — works with any task description language)
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_DIRECTIVE = `You are the AI Governor — the Constitution Enforcer for an autonomous software factory.
Your sole purpose is to evaluate proposed tasks against the Constitution before they are allowed to touch production code.
You are impartial, evidence-driven, and conservative. When in doubt, reject.

SYSTEM DIRECTIVE:
"Every task must justify its existence against the Constitution. If a task cannot answer the 6 Decision Framework questions with evidence, it is rejected — no exceptions, no overrides, no 'just this once'."`

const SEVEN_GOLDEN_RULES = `7 GOLDEN RULES (the Constitution):
1. never_create_interesting    — Never create features just because they are interesting. Only create with evidence.
2. never_duplicate_functionality — Never duplicate functionality. Extend existing systems first.
3. never_publish_simulated     — Never publish simulated research as if it were real.
4. never_reduce_documentation  — Never reduce documentation coverage.
5. never_reduce_qa            — Never reduce QA coverage.
6. never_reduce_observatory   — Never reduce Observatory credibility.
7. never_push_to_production   — Never push directly to production — always through a PR.`

const DECISION_FRAMEWORK = `DECISION FRAMEWORK — 6 Questions every task must pass. If ANY answer is NO, REJECT:
1. solvesRealProblem    — Does this solve a real problem? (a user-visible pain, a measured regression, a stated strategic goal)
2. hasEvidence          — Is there evidence? (analytics, user feedback, observatory data, a ticket, a KPI movement)
3. fitsArchitecture     — Does it fit the architecture? (uses the existing stack: Next.js 16 App Router, Prisma, shadcn/ui, no indigo/blue)
4. existingModuleSolves — Can an existing module already solve it? (if YES → reject and tell them to extend it)
5. improvesKPI          — Will it improve a measurable KPI?
6. canMeasure           — Can the improvement be measured after implementation?`

const GROWTH_PRIORITIES = `GROWTH PRIORITIES (1 = highest, 5 = lowest). Tasks that move higher priorities are preferred:
1. Activation     — Help a free user reach their first value
2. Retention      — Help a user reach repeat value
3. Referral       — Turn users into new users
4. Revenue        — Convert users to MRR
5. Cost Reduction — Lower CAC or infrastructure cost`

const OUTPUT_CONTRACT = `Respond with a SINGLE JSON object and NOTHING else. No markdown, no prose, no code fences.
The JSON MUST have this exact shape:
{
  "decisionFramework": {
    "solvesRealProblem":    boolean,
    "hasEvidence":          boolean,
    "fitsArchitecture":     boolean,
    "existingModuleSolves":  boolean,
    "improvesKPI":           boolean,
    "canMeasure":            boolean
  },
  "approved":      boolean,
  "confidence":    number (0.0 - 1.0),
  "rejectionReason": string (omit or empty if approved),
  "governorNotes": string (1-3 sentences, the Governor's reasoning),
  "ruleApplied":   string (one of: never_create_interesting | never_duplicate_functionality | never_publish_simulated | never_reduce_documentation | never_reduce_qa | never_reduce_observatory | never_push_to_production | evidence_required | extend_existing | none, or null if approved with no rule violated),
  "impactScore":   number (0 - 10)
}

DECISION RULES (follow strictly):
- If ANY decisionFramework answer is false → approved MUST be false.
- If existingModuleSolves is true → approved MUST be false (rule: extend_existing).
- If taskType is "feature" and improvesKPI is false or canMeasure is false → approved MUST be false (rule: evidence_required).
- If taskType is "docs" or taskType is "test" and improvesKPI is false but solvesRealProblem is true → still ALLOW approval (docs/tests maintain coverage; they do not need a hard KPI).
- approved=true only if ALL six answers are true (or the docs/test exception applies) AND confidence >= 0.6.
- impactScore reflects how much this task moves a Growth Priority KPI (0 = none, 10 = game-changer).`

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const GROWTH_PRIORITY_LABELS: Record<number, string> = {
  1: 'Activation',
  2: 'Retention',
  3: 'Referral',
  4: 'Revenue',
  5: 'Cost Reduction',
}

function buildSystemPrompt(): string {
  return [
    SYSTEM_DIRECTIVE,
    '',
    SEVEN_GOLDEN_RULES,
    '',
    DECISION_FRAMEWORK,
    '',
    GROWTH_PRIORITIES,
    '',
    OUTPUT_CONTRACT,
  ].join('\n')
}

function buildUserPrompt(proposal: TaskProposal): string {
  const priorityLabel = GROWTH_PRIORITY_LABELS[proposal.priority] || 'Unknown'
  const lines: string[] = [
    'EVALUATE THE FOLLOWING TASK PROPOSAL AGAINST THE CONSTITUTION.',
    '',
    'TASK PROPOSAL:',
    `  title:          ${proposal.title}`,
    `  description:    ${proposal.description}`,
    `  sourceEngine:   ${proposal.sourceEngine}`,
    `  taskType:       ${proposal.taskType}`,
    `  priority:       ${proposal.priority} (${priorityLabel})`,
    `  targetKPI:      ${proposal.targetKPI ?? '(not specified)'}`,
    `  estimatedHours: ${proposal.estimatedHours ?? '(not specified)'}`,
    '',
    'INSTRUCTIONS:',
    '- Answer all 6 Decision Framework questions honestly based ONLY on what the proposal states.',
    '- If the proposal does NOT mention evidence or a measurable KPI, treat that question as false.',
    '- Be strict. Vague "improves UX" claims without a targetKPI are NOT evidence.',
    '- Return ONLY the JSON object described in the system prompt.',
  ]
  return lines.join('\n')
}

// extractJsonObject is now imported from ./llm-utils

interface ParsedGovernorResponse {
  decisionFramework: DecisionFramework
  approved: boolean
  confidence: number
  rejectionReason?: string
  governorNotes: string
  ruleApplied?: string
  impactScore: number
}

function coerceBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim()
    return v === 'true' || v === 'yes' || v === '1'
  }
  if (typeof value === 'number') return value !== 0
  return fallback
}

function coerceNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : NaN
  if (Number.isNaN(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function coerceString(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

/** Defensive parse + post-processing of the LLM JSON output. */
function parseGovernorResponse(raw: string, proposal: TaskProposal): ParsedGovernorResponse {
  const jsonStr = extractJsonObject(raw)
  if (!jsonStr) {
    throw new Error('No valid JSON object found in LLM response')
  }
  const obj = JSON.parse(jsonStr) as Record<string, unknown>

  const dfRaw = (obj.decisionFramework ?? {}) as Record<string, unknown>
  const decisionFramework: DecisionFramework = {
    solvesRealProblem:    coerceBoolean(dfRaw.solvesRealProblem),
    hasEvidence:          coerceBoolean(dfRaw.hasEvidence),
    fitsArchitecture:     coerceBoolean(dfRaw.fitsArchitecture),
    existingModuleSolves: coerceBoolean(dfRaw.existingModuleSolves),
    improvesKPI:          coerceBoolean(dfRaw.improvesKPI),
    canMeasure:           coerceBoolean(dfRaw.canMeasure),
  }

  const governorNotes = coerceString(obj.governorNotes, 'Governor evaluated the task.')
  const ruleApplied = coerceString(obj.ruleApplied, '') || undefined
  const rejectionReason = coerceString(obj.rejectionReason, '') || undefined
  const confidence = coerceNumber(obj.confidence, 0.5, 0, 1)
  const impactScore = coerceNumber(obj.impactScore, 5, 0, 10)

  // ── Re-derive `approved` from the framework to enforce the Constitution ──
  // The LLM's `approved` is a suggestion; the Governor ALWAYS re-verifies.
  const isDocsOrTest = proposal.taskType === 'docs' || proposal.taskType === 'test'
  const docsTestException =
    isDocsOrTest &&
    decisionFramework.solvesRealProblem &&
    decisionFramework.hasEvidence &&
    decisionFramework.fitsArchitecture

  let approved: boolean
  if (decisionFramework.existingModuleSolves) {
    // Existing module can solve it → reject and tell them to extend
    approved = false
  } else if (docsTestException) {
    // Docs/test may skip the strict improvesKPI+canMeasure gate
    approved =
      decisionFramework.solvesRealProblem &&
      decisionFramework.hasEvidence &&
      decisionFramework.fitsArchitecture &&
      confidence >= 0.6
  } else {
    approved =
      decisionFramework.solvesRealProblem &&
      decisionFramework.hasEvidence &&
      decisionFramework.fitsArchitecture &&
      !decisionFramework.existingModuleSolves &&
      decisionFramework.improvesKPI &&
      decisionFramework.canMeasure &&
      confidence >= 0.6
  }

  // If LLM said approved but our re-derivation says no → reject (Constitution wins)
  const llmApproved = coerceBoolean(obj.approved)
  if (llmApproved && !approved) {
    approved = false
  }

  return {
    decisionFramework,
    approved,
    confidence,
    rejectionReason: approved ? undefined : rejectionReason,
    governorNotes,
    ruleApplied,
    impactScore,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule-based fallback (when LLM is unavailable or returns garbage)
// ─────────────────────────────────────────────────────────────────────────────

function ruleBasedEvaluation(proposal: TaskProposal): ParsedGovernorResponse {
  const notes: string[] = ['Governor ran in rule-based fallback mode (LLM unavailable).']

  // Default conservative framework
  const decisionFramework: DecisionFramework = {
    solvesRealProblem:    true,
    hasEvidence:          false,
    fitsArchitecture:     true,
    existingModuleSolves: false,
    improvesKPI:          false,
    canMeasure:           false,
  }

  let approved = false
  let ruleApplied: string | undefined
  let rejectionReason: string | undefined

  // Rule 1: A feature without a targetKPI cannot be measured → reject
  if (proposal.taskType === 'feature' && !proposal.targetKPI) {
    decisionFramework.improvesKPI = false
    decisionFramework.canMeasure = false
    ruleApplied = 'evidence_required'
    rejectionReason =
      'Feature proposal has no targetKPI — cannot demonstrate measurable improvement. (Rule-based fallback: evidence_required)'
    notes.push('Feature without targetKPI → rejected (no measurable improvement).')
  } else if (proposal.taskType === 'feature' && proposal.targetKPI) {
    decisionFramework.improvesKPI = true
    decisionFramework.canMeasure = true
    decisionFramework.hasEvidence = true
    approved = true
    notes.push('Feature with targetKPI → provisionally approved in fallback mode.')
  } else if (proposal.taskType === 'docs' || proposal.taskType === 'test') {
    // Docs/tests maintain coverage — allow if they describe a real problem
    decisionFramework.hasEvidence = true
    decisionFramework.improvesKPI = true
    decisionFramework.canMeasure = true
    approved = true
    notes.push(`${proposal.taskType} task — coverage maintenance approved in fallback mode.`)
  } else if (proposal.taskType === 'bugfix' || proposal.taskType === 'refactor' || proposal.taskType === 'cleanup') {
    // Bugfixes / refactors / cleanups: allow if they have a description
    decisionFramework.hasEvidence = proposal.description.length > 20
    decisionFramework.improvesKPI = true
    decisionFramework.canMeasure = true
    approved = decisionFramework.hasEvidence
    if (!approved) {
      ruleApplied = 'evidence_required'
      rejectionReason = 'Task description is too short to demonstrate a real problem. (Rule-based fallback)'
      notes.push('Description too short → rejected.')
    } else {
      notes.push(`${proposal.taskType} task → provisionally approved in fallback mode.`)
    }
  } else {
    // Default: approve with low confidence
    decisionFramework.hasEvidence = true
    decisionFramework.improvesKPI = true
    decisionFramework.canMeasure = true
    approved = true
    notes.push('Unknown taskType — approved with low confidence in fallback mode.')
  }

  return {
    decisionFramework,
    approved,
    confidence: 0.5,
    rejectionReason,
    governorNotes: notes.join(' '),
    ruleApplied,
    impactScore: approved ? 5 : 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DB Persistence (defensive — DB may be unavailable)
// ─────────────────────────────────────────────────────────────────────────────

async function persistInterception(params: {
  engineName: string
  proposedAction: string
  governorQuestion: string
  engineResponse: string
  outcome: 'approved' | 'rejected' | 'returned'
  reasoning: string
  ruleApplied?: string
}): Promise<{ interceptionId: string; taskId: string | null }> {
  const emptyId = ''
  try {
    const interception = await db.governorInterception.create({
      data: {
        engineName:       params.engineName,
        proposedAction:   params.proposedAction,
        governorQuestion: params.governorQuestion,
        engineResponse:   params.engineResponse,
        outcome:          params.outcome,
        reasoning:        params.reasoning,
        ruleApplied:      params.ruleApplied ?? null,
      },
    })
    return { interceptionId: interception.id, taskId: null }
  } catch (err) {
    console.error('[ai-governor] Failed to persist GovernorInterception:', err)
    return { interceptionId: emptyId, taskId: null }
  }
}

async function persistFactoryTask(
  proposal: TaskProposal,
  parsed: ParsedGovernorResponse,
  interceptionId: string,
): Promise<string | null> {
  try {
    const task = await db.factoryTask.create({
      data: {
        title:                   proposal.title,
        description:              proposal.description,
        type:                     sourceEngineToFactoryType(proposal.sourceEngine),
        sourceEngine:             proposal.sourceEngine,
        taskType:                 proposal.taskType,
        priority:                 priorityToString(proposal.priority),
        status:                   'approved',
        rejectionReason:          parsed.rejectionReason ?? null,
        governorNotes:             parsed.governorNotes,
        confidence:               parsed.confidence,
        solvesRealProblem:        parsed.decisionFramework.solvesRealProblem,
        hasEvidence:              parsed.decisionFramework.hasEvidence,
        fitsArchitecture:         parsed.decisionFramework.fitsArchitecture,
        existingModuleSolves:    parsed.decisionFramework.existingModuleSolves,
        improvesKPI:              parsed.decisionFramework.improvesKPI,
        canMeasure:               parsed.decisionFramework.canMeasure,
        impactScore:              parsed.impactScore,
        estimatedHours:           proposal.estimatedHours ?? 0,
        targetKPI:                proposal.targetKPI ?? null,
        evaluatedAt:              new Date(),
      },
    })

    // Link the interception back to the FactoryTask for traceability
    if (interceptionId) {
      try {
        await db.governorInterception.update({
          where: { id: interceptionId },
          data:  { taskId: task.id },
        })
      } catch (err) {
        console.warn('[ai-governor] Could not link interception → FactoryTask:', err)
      }
    }

    return task.id
  } catch (err) {
    console.error('[ai-governor] Failed to persist approved FactoryTask:', err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: evaluateTask()
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate a proposed task against the Constitution.
 *
 * Flow:
 *   1. Check in-memory LLM cache for the proposal hash. On HIT, reuse the
 *      cached `ParsedGovernorResponse` and SKIP the routeLLM() call (cost
 *      saving). DB persistence still happens so the dashboard always reflects
 *      the latest evaluation event.
 *   2. On cache MISS: build Constitution system prompt + proposal user prompt,
 *      call routeLLM with taskType='reasoning', tier='managed', temperature=0.3,
 *      parse the LLM JSON response; re-derive `approved` from the Decision
 *      Framework. On LLM failure or invalid JSON → fall back to rule-based.
 *   3. Persist a GovernorInterception record (ALWAYS — even on cache hit).
 *   4. If approved → create a FactoryTask with status='approved' (ALWAYS).
 *   5. Cache the parsed response (NOT the GovernorDecision, because
 *      interceptionId is per-evaluation).
 *   6. Return the GovernorDecision
 */
export async function evaluateTask(proposal: TaskProposal): Promise<GovernorDecision> {
  const governorQuestion = 'Does this task satisfy all 6 Decision Framework questions with evidence?'
  const proposedAction = `${proposal.title} — ${proposal.description}`

  // ── Cache check: skip the LLM call if we recently evaluated an identical proposal.
  // The cached `ParsedGovernorResponse` is reused; DB persistence is still
  // performed below so each evaluation event is logged.
  const hash = hashProposal(proposal)
  const cachedAt = cacheTimestamps.get(hash)
  let parsed: ParsedGovernorResponse
  let llmUsed: boolean

  if (cachedAt !== undefined && Date.now() - cachedAt < CACHE_TTL_MS) {
    const cached = parsedResponseCache.get(hash)
    if (cached) {
      console.log(`[ai-governor] Cache HIT for task "${proposal.title}" (hash=${hash}) — skipping routeLLM`)
      parsed = cached
      llmUsed = true // the cached decision came from an LLM run originally
    } else {
      // Cache timestamp exists but no decision — treat as miss
      const result = await runLLMEvaluation(proposal)
      parsed = result.parsed
      llmUsed = result.llmUsed
    }
  } else {
    const result = await runLLMEvaluation(proposal)
    parsed = result.parsed
    llmUsed = result.llmUsed
  }

  // Augment notes with mode
  const governorNotes = llmUsed
    ? parsed.governorNotes
    : `${parsed.governorNotes} [evaluated by LLM: no — rule-based fallback used]`

  // Determine outcome for DB
  const outcome: 'approved' | 'rejected' | 'returned' = parsed.approved ? 'approved' : 'rejected'

  // Default ruleApplied if rejected
  const ruleApplied = parsed.approved
    ? undefined
    : parsed.ruleApplied || 'evidence_required'

  const rejectionReason = parsed.approved
    ? undefined
    : parsed.rejectionReason || 'Task failed one or more Decision Framework questions.'

  // ── Step 5: Persist GovernorInterception (ALWAYS — even on cache hit) ──
  const { interceptionId, taskId: existingTaskId } = await persistInterception({
    engineName:       proposal.sourceEngine,
    proposedAction,
    governorQuestion,
    engineResponse:   proposal.description,
    outcome,
    reasoning:        governorNotes,
    ruleApplied,
  })

  // ── Step 6: If approved → create FactoryTask (ALWAYS — even on cache hit) ──
  let taskId = existingTaskId
  if (parsed.approved) {
    const newTaskId = await persistFactoryTask(proposal, parsed, interceptionId)
    if (newTaskId) taskId = newTaskId
  }

  // ── Step 7: Build GovernorDecision ──
  const decision: GovernorDecision = {
    approved:           parsed.approved,
    confidence:         parsed.confidence,
    rejectionReason,
    governorNotes,
    ruleApplied,
    decisionFramework:  parsed.decisionFramework,
    impactScore:        parsed.impactScore,
    interceptionId:     interceptionId || `fallback-${Date.now()}`,
  }

  console.log(
    `[ai-governor] ${parsed.approved ? 'APPROVED' : 'REJECTED'} task "${proposal.title}" ` +
    `(confidence=${parsed.confidence.toFixed(2)}, impact=${parsed.impactScore}, llmUsed=${llmUsed}` +
    `${taskId ? `, taskId=${taskId}` : ''})`,
  )

  // ── Cache write: store the PARSED RESPONSE (not the GovernorDecision,
  // because interceptionId is unique per-evaluation). Done AFTER the LLM
  // call but BEFORE returning, so subsequent calls with the same proposal
  // hash will hit the cache and skip routeLLM().
  parsedResponseCache.set(hash, parsed)
  cacheTimestamps.set(hash, Date.now())

  return decision
}

/**
 * Run the LLM evaluation for a proposal. Returns the parsed response and a
 * flag indicating whether the LLM was actually used (vs rule-based fallback).
 *
 * Extracted from `evaluateTask()` so the cache check can call it on miss
 * without duplicating the LLM call logic.
 */
async function runLLMEvaluation(proposal: TaskProposal): Promise<{
  parsed: ParsedGovernorResponse
  llmUsed: boolean
}> {
  try {
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(proposal)

    const result = await routeLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      {
        taskType:    'reasoning',
        tier:        'managed',
        temperature: 0.3,
        maxTokens:   4096, // GLM 5.2 is a reasoning model — needs extra tokens for chain-of-thought
        timeout:     45000,
        allowSimulation: false, // Governor must NOT run on simulation data
      },
    )

    if (!result.content || result.status === 'simulation' || result.content.trim().length === 0) {
      console.warn('[ai-governor] LLM returned empty/simulation — falling back to rule-based.')
      return { parsed: ruleBasedEvaluation(proposal), llmUsed: false }
    }

    try {
      return { parsed: parseGovernorResponse(result.content, proposal), llmUsed: true }
    } catch (err) {
      console.warn('[ai-governor] Failed to parse LLM JSON, falling back to rule-based:', err)
      return { parsed: ruleBasedEvaluation(proposal), llmUsed: false }
    }
  } catch (err) {
    console.error('[ai-governor] routeLLM threw, falling back to rule-based:', err)
    return { parsed: ruleBasedEvaluation(proposal), llmUsed: false }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats: getGovernorStats()
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return aggregate Governor statistics for the control panel.
 *
 * - totalIntercepted:   all-time count of GovernorInterception rows
 * - totalApproved:      count where outcome='approved'
 * - rejectionRate:      totalRejected / totalIntercepted (0 if no interceptions)
 * - violationsPrevented: count where outcome='rejected' (a violation was caught)
 * - recentInterceptions: last 10 by createdAt desc
 */
export async function getGovernorStats(): Promise<GovernorStats> {
  const emptyStats: GovernorStats = {
    totalIntercepted:    0,
    totalApproved:       0,
    rejectionRate:       0,
    violationsPrevented: 0,
    recentInterceptions: [],
  }

  try {
    const [total, approved, rejected, recent] = await Promise.all([
      db.governorInterception.count(),
      db.governorInterception.count({ where: { outcome: 'approved' } }),
      db.governorInterception.count({ where: { outcome: 'rejected' } }),
      db.governorInterception.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    const rejectionRate = total > 0 ? rejected / total : 0

    return {
      totalIntercepted:    total,
      totalApproved:       approved,
      rejectionRate,
      violationsPrevented: rejected, // every rejection = a Constitution violation prevented
      recentInterceptions: recent.map((r) => ({
        id:               r.id,
        taskId:           r.taskId,
        engineName:       r.engineName,
        proposedAction:   r.proposedAction,
        governorQuestion:  r.governorQuestion,
        engineResponse:   r.engineResponse,
        outcome:           r.outcome,
        reasoning:         r.reasoning,
        ruleApplied:       r.ruleApplied,
        createdAt:         r.createdAt,
      })),
    }
  } catch (err) {
    console.error('[ai-governor] getGovernorStats failed:', err)
    return emptyStats
  }
}
