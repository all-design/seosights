/**
 * Hub-and-Spoke Agent Communication Protocol
 *
 * Enforces JSON-strict inter-agent communication with a Master Director
 * orchestrating 7 sub-agents. Every sub-agent MUST return a structured
 * AgentResponse that is validated before being merged into the ContextWindow.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PROTOCOL OVERVIEW — 4 Communication Steps
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Step 1: Input from Frontend → Backend (Initialization)
 *   User enters URL → backend sends initial JSON to Master Director
 *
 * Step 2: Master Director → Sub-agents (Task Dispatch)
 *   Master Director sends each agent a specific task_scope with context
 *
 * Step 3: Sub-agents → Master Director (Strict Output)
 *   Each sub-agent returns a JSON-strict response with findings + actions
 *
 * Step 4: Final Assembled JSON (Shared Context for Database)
 *   Master Director synthesizes all results into a unified project record
 *
 * Key benefits:
 * - If one agent fails or returns invalid JSON, retry just that agent
 *   without restarting the entire analysis (saves tokens and time)
 * - ContextWindow accumulates knowledge across sub-agent results
 * - Master Director runs a final synthesis pass with full context
 * - Structured Outputs enforcement: JSON Mode for OpenAI, prompt-based for others
 */

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Frontend Input → Backend (Initialization)
// ─────────────────────────────────────────────────────────────────────────────

/** Initialization payload from frontend to backend */
export interface AnalysisInitPayload {
  project_id: string       // UUID of the project
  target_url: string       // e.g. "https://primer.com"
  target_market: string    // e.g. "US", "Global"
  timestamp: string        // ISO 8601
  execution_mode: 'auto-pilot' | 'co-pilot'
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Master Director → Sub-agents (Task Dispatch)
// ─────────────────────────────────────────────────────────────────────────────

/** Task scope sent from Master Director to each sub-agent */
export interface TaskScope {
  action: string           // e.g. "ANALYZE_LLM_MENTIONS", "AUDIT_STRUCTURED_DATA"
  /** Optional: engines to query (for competitor_analyst, etc.) */
  required_engines?: string[]   // e.g. ["perplexity", "chatgpt", "google_ai_overviews"]
  /** Optional: checkpoints to verify (for tech_schema, etc.) */
  checkpoints?: string[]        // e.g. ["faq_schema", "llms_txt_presence", "robots_txt_bot_blocks"]
  /** Strict output format requirement */
  output_strict_format: 'JSON'
}

/** Dispatch message from Master Director to a sub-agent */
export interface AgentDispatch {
  session_id: string       // e.g. "md-session-9921"
  agent_target: string     // e.g. "competitor_analyst", "tech_schema"
  context: {
    target_url: string
    market: string
    seed_keywords?: string[]
  }
  task_scope: TaskScope
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Sub-agents → Master Director (Strict Output)
// ─────────────────────────────────────────────────────────────────────────────

/** A single recommended action from a sub-agent (enhanced with action_id and sight) */
export interface AgentAction {
  action_id: string        // e.g. "ca_01", "ts_01"
  sight: 'SEO' | 'AEO' | 'GEO' | 'ALL'
  description: string
  estimated_impact: 'critical' | 'high' | 'medium' | 'low'
  /** Backward compat: also support the old format fields */
  action?: string          // deprecated, use description
  priority?: 'high' | 'medium' | 'low'  // deprecated, use estimated_impact
  expected_impact?: string  // deprecated
  pillar?: 'seo' | 'aeo' | 'geo' | 'all'  // deprecated, use sight
  effort?: 'high' | 'medium' | 'low'
}

/** Citation gap detected by competitor analyst */
export interface CitationGap {
  source_domain: string
  reason: string
  priority: 'critical' | 'high' | 'medium' | 'low'
}

/** Agent Response Protocol — all sub-agents MUST return this format */
export interface AgentResponse {
  agent_name: string       // e.g. "competitor_analyst"
  status: 'success' | 'partial' | 'error'
  findings: Record<string, unknown>  // Structured findings specific to each agent
  recommended_actions: AgentAction[]
  token_usage: { prompt: number; completion: number }
  /** Legacy fields for backward compatibility */
  critical_findings?: string[]  // deprecated: use findings
  data?: Record<string, unknown>  // deprecated: use findings
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Final Assembled JSON (Shared Context for Database)
// ─────────────────────────────────────────────────────────────────────────────

/** Overall scores across the Three Sights */
export interface OverallScores {
  seo_score: number   // 0-100
  aeo_score: number   // 0-100
  geo_score: number   // 0-100
}

/** A single roadmap task in the 90-day plan */
export interface RoadmapTask {
  agent: string     // e.g. "tech_schema"
  task: string      // e.g. "Deploy llms.txt and unblock ClaudeBot"
  sight: 'SEO' | 'AEO' | 'GEO'
}

/** 90-day roadmap structure */
export interface NinetyDayRoadmap {
  week_1: RoadmapTask[]
  week_2: RoadmapTask[]
  week_3: RoadmapTask[]
  week_4: RoadmapTask[]
  week_5_to_8: RoadmapTask[]
  week_9_to_12: RoadmapTask[]
  /** Allow dynamic week keys for flexibility */
  [key: string]: RoadmapTask[] | undefined
}

/** Final assembled JSON that gets written to the database */
export interface FinalAssembledReport {
  project_id: string
  overall_scores: OverallScores
  /** 90-day roadmap assembled from all sub-agent recommended_actions */
  '90_day_roadmap': NinetyDayRoadmap
  /** The full findings from each sub-agent, keyed by agent_name */
  agent_findings: Record<string, Record<string, unknown>>
  /** Flat list of all recommended_actions across all agents, deduplicated */
  all_recommended_actions: AgentAction[]
  /** Metadata about the analysis run */
  meta: {
    session_id: string
    execution_mode: 'auto-pilot' | 'co-pilot'
    started_at: string
    completed_at: string
    total_tokens_used: number
    total_cost_usd: number
    agents_completed: number
    agents_failed: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Window — Accumulated Knowledge During Analysis
// ─────────────────────────────────────────────────────────────────────────────

/** Master Director context window — accumulates sub-agent results */
export interface ContextWindow {
  target_url: string
  target_domain: string
  target_market: string
  site_name: string
  scan_data: Record<string, unknown>  // raw crawl data
  sub_agent_results: Map<string, AgentResponse>
  merged_knowledge: Record<string, unknown>
  /** Session tracking for the protocol */
  session_id: string
  execution_mode: 'auto-pilot' | 'co-pilot'
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that a raw value conforms to the AgentResponse protocol.
 *
 * Supports both the NEW format (findings, recommended_actions with action_id/sight)
 * and the LEGACY format (critical_findings, data, recommended_actions with action/priority).
 *
 * Lenient: only checks the REQUIRED top-level fields exist with correct types.
 * Missing optional fields get defaults. Extra fields are allowed.
 */
export function validateAgentResponse(
  raw: unknown
): { valid: boolean; response?: AgentResponse; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Response is not an object' }
  }

  const obj = raw as Record<string, unknown>

  // ── agent_name is required ─────────────────────────────────────────────
  if (!obj.agent_name || typeof obj.agent_name !== 'string') {
    obj.agent_name = obj.agent_name || 'unknown_agent'
  }

  // ── status must be valid ───────────────────────────────────────────────
  const validStatuses = ['success', 'partial', 'error']
  if (obj.status && !validStatuses.includes(obj.status as string)) {
    obj.status = 'partial'
  }
  if (!obj.status) {
    obj.status = 'partial'
  }

  // ── Normalize findings ─────────────────────────────────────────────────
  // NEW format: obj.findings (structured object)
  // LEGACY format: obj.critical_findings (string array) + obj.data (object)
  // Strategy: Merge all into obj.findings for the canonical format
  if (!obj.findings || typeof obj.findings !== 'object' || Array.isArray(obj.findings)) {
    const mergedFindings: Record<string, unknown> = {}

    // Pull from legacy `data` field
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      Object.assign(mergedFindings, obj.data as Record<string, unknown>)
    } else {
      // If there's no "data" or "findings" field but the response has other structured fields,
      // treat the whole object minus protocol fields as the data payload
      const protocolFields = new Set([
        'agent_name', 'status', 'findings', 'recommended_actions',
        'data', 'critical_findings', 'token_usage',
      ])
      for (const [key, value] of Object.entries(obj)) {
        if (!protocolFields.has(key)) {
          mergedFindings[key] = value
        }
      }
    }

    // Pull from legacy `critical_findings` field
    if (obj.critical_findings && Array.isArray(obj.critical_findings)) {
      mergedFindings.critical_findings = obj.critical_findings
    }

    obj.findings = mergedFindings
  }

  // ── Normalize recommended_actions ──────────────────────────────────────
  if (obj.recommended_actions && !Array.isArray(obj.recommended_actions)) {
    obj.recommended_actions = []
  }
  if (!obj.recommended_actions) {
    obj.recommended_actions = []
  }

  // Normalize each action to include both new and legacy fields
  obj.recommended_actions = (obj.recommended_actions as AgentAction[]).map((action, idx) => {
    if (typeof action !== 'object' || action === null) return null
    const a = action as Record<string, unknown>

    // Ensure action_id
    if (!a.action_id) {
      const agentPrefix = (obj.agent_name as string).slice(0, 2)
      a.action_id = `${agentPrefix}_${String(idx + 1).padStart(2, '0')}`
    }

    // Ensure sight/pillar compatibility
    if (!a.sight && a.pillar) {
      a.sight = (a.pillar as string).toUpperCase()
    }
    if (!a.pillar && a.sight) {
      a.pillar = (a.sight as string).toLowerCase()
    }
    if (!a.sight && !a.pillar) {
      a.sight = 'SEO'
      a.pillar = 'seo'
    }

    // Ensure description/action compatibility
    if (!a.description && a.action) {
      a.description = a.action
    }
    if (!a.action && a.description) {
      a.action = a.description
    }

    // Ensure estimated_impact/priority compatibility
    if (!a.estimated_impact && a.priority) {
      a.estimated_impact = a.priority
    }
    if (!a.priority && a.estimated_impact) {
      a.priority = a.estimated_impact
    }

    return a as AgentAction
  }).filter(Boolean)

  // ── token_usage is optional, default to zeros ──────────────────────────
  if (!obj.token_usage || typeof obj.token_usage !== 'object') {
    obj.token_usage = { prompt: 0, completion: 0 }
  } else {
    const tu = obj.token_usage as Record<string, unknown>
    tu.prompt = typeof tu.prompt === 'number' ? tu.prompt : 0
    tu.completion = typeof tu.completion === 'number' ? tu.completion : 0
  }

  // ── If there is NO meaningful data at all, mark as error ───────────────
  const findings = obj.findings as Record<string, unknown>
  const hasData =
    Object.keys(findings).length > 0 ||
    (obj.recommended_actions as AgentAction[]).length > 0

  if (!hasData && obj.status !== 'error') {
    obj.status = 'partial'
  }

  return {
    valid: true,
    response: obj as unknown as AgentResponse,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Building
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Context requirements that each sub-agent declares.
 * Defines what data the agent needs from the ContextWindow to function.
 */
export interface ContextRequirements {
  /** Which pieces of scan_data this agent needs */
  scanFields: string[]
  /** Which prior agent results this agent depends on */
  dependsOnAgents: string[]
  /** Whether this agent needs the full merged_knowledge */
  needsMergedKnowledge: boolean
}

/**
 * Build a dispatch message (Step 2) for a specific sub-agent.
 *
 * Creates the AgentDispatch with session_id, agent_target, context,
 * and task_scope — exactly as the Hub-and-Spoke protocol specifies.
 */
export function buildAgentDispatch(
  agentId: string,
  sessionId: string,
  context: ContextWindow,
  taskScope: TaskScope,
): AgentDispatch {
  return {
    session_id: sessionId,
    agent_target: agentId,
    context: {
      target_url: context.target_url,
      market: context.target_market,
    },
    task_scope: taskScope,
  }
}

/**
 * Build a context string for a specific sub-agent from the ContextWindow.
 *
 * This is injected into the agent's user prompt so it has access to
 * prior agent results and relevant scan data. Includes the protocol
 * dispatch context as specified in Step 2.
 */
export function buildSubAgentContext(
  agentId: string,
  context: ContextWindow
): string {
  const parts: string[] = []

  // Always include target info (Step 2 context)
  parts.push(`TARGET: ${context.target_url} (${context.site_name})`)
  parts.push(`DOMAIN: ${context.target_domain}`)
  parts.push(`MARKET: ${context.target_market}`)
  parts.push(`SESSION: ${context.session_id}`)
  parts.push(`MODE: ${context.execution_mode}`)

  // Include relevant scan data
  if (context.scan_data && Object.keys(context.scan_data).length > 0) {
    parts.push('\nSCAN DATA:')
    for (const [key, value] of Object.entries(context.scan_data)) {
      if (typeof value === 'string' && value.length > 0) {
        parts.push(`  ${key}: ${value.slice(0, 500)}`)
      } else if (typeof value === 'object' && value !== null) {
        parts.push(`  ${key}: ${JSON.stringify(value).slice(0, 500)}`)
      }
    }
  }

  // Include results from prior agents (Step 3 findings format)
  if (context.sub_agent_results.size > 0) {
    parts.push('\nPRIOR AGENT FINDINGS:')
    for (const [agentName, result] of context.sub_agent_results) {
      if (agentName === agentId) continue // Don't include own results

      parts.push(`  [${agentName}] status=${result.status}`)

      // Show structured findings (new format)
      if (result.findings && typeof result.findings === 'object') {
        const findingsKeys = Object.keys(result.findings as Record<string, unknown>)
        if (findingsKeys.length > 0) {
          const findingsPreview = JSON.stringify(result.findings).slice(0, 300)
          parts.push(`    Findings: ${findingsPreview}`)
        }
      }

      // Show top recommended actions
      const keyActions = (result.recommended_actions || [])
        .filter((a) => a.estimated_impact === 'critical' || a.estimated_impact === 'high' || a.priority === 'high')
        .slice(0, 3)
      if (keyActions.length > 0) {
        parts.push(
          `    Top Actions: ${keyActions.map((a) => `[${a.action_id || '?'}] ${a.description || a.action || ''} (${a.sight || a.pillar || '?'})`).join('; ')}`
        )
      }
    }
  }

  // Include merged knowledge summary if available
  if (
    context.merged_knowledge &&
    Object.keys(context.merged_knowledge).length > 0
  ) {
    parts.push('\nMERGED KNOWLEDGE SUMMARY:')
    const summaryKeys = [
      'overallScores',
      'overall_scores',
      'summary',
      'executiveActions',
    ] as const
    for (const key of summaryKeys) {
      if (context.merged_knowledge[key]) {
        const val = context.merged_knowledge[key]
        if (typeof val === 'string') {
          parts.push(`  ${key}: ${val.slice(0, 200)}`)
        } else {
          parts.push(`  ${key}: ${JSON.stringify(val).slice(0, 300)}`)
        }
      }
    }
  }

  parts.push(
    '\nPROTOCOL REMINDER (Step 3): Return ONLY valid JSON in this exact format:'
  )
  parts.push('{')
  parts.push('  "agent_name": "your_agent_name",')
  parts.push('  "status": "success|partial|error",')
  parts.push('  "findings": { ... your structured data ... },')
  parts.push('  "recommended_actions": [{ "action_id": "xx_01", "sight": "SEO|AEO|GEO", "description": "...", "estimated_impact": "critical|high|medium|low" }],')
  parts.push('  "token_usage": { "prompt": N, "completion": N }')
  parts.push('}')
  parts.push('Do NOT include markdown formatting, backticks, or introductory/concluding text.')

  return parts.join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Merging
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge a validated sub-agent result into the ContextWindow.
 *
 * This updates both sub_agent_results and merged_knowledge.
 * The merged_knowledge accumulates the "findings" field from each agent,
 * with deep merging for nested objects and array concatenation.
 */
export function mergeSubAgentResult(
  context: ContextWindow,
  result: AgentResponse
): ContextWindow {
  // Store the full result
  context.sub_agent_results.set(result.agent_name, result)

  // Merge the agent's findings into merged_knowledge
  const dataToMerge = result.findings && typeof result.findings === 'object'
    ? result.findings as Record<string, unknown>
    : (result.data && typeof result.data === 'object')
      ? result.data as Record<string, unknown>
      : {}

  if (Object.keys(dataToMerge).length > 0) {
    context.merged_knowledge = deepMergeObjects(
      context.merged_knowledge,
      dataToMerge
    )
  }

  return context
}

/**
 * Create an initial ContextWindow for a new analysis run.
 */
export function createContextWindow(params: {
  url: string
  domain: string
  market: string
  siteName: string
  scanData?: Record<string, unknown>
  sessionId: string
  executionMode?: 'auto-pilot' | 'co-pilot'
}): ContextWindow {
  return {
    target_url: params.url,
    target_domain: params.domain,
    target_market: params.market,
    site_name: params.siteName,
    scan_data: params.scanData || {},
    sub_agent_results: new Map(),
    merged_knowledge: {},
    session_id: params.sessionId,
    execution_mode: params.executionMode || 'co-pilot',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Final Assembly
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assemble the final report from all sub-agent results.
 * This is Step 4 of the Hub-and-Spoke protocol.
 *
 * Produces a FinalAssembledReport that gets written to the database
 * and displayed on the frontend.
 */
export function assembleFinalReport(
  context: ContextWindow,
  startedAt: string,
  totalTokensUsed: number,
  totalCostUsd: number,
): FinalAssembledReport {
  // Extract overall scores from Master Director's result
  const mdResult = context.sub_agent_results.get('master_director')
  const mdFindings = (mdResult?.findings || mdResult?.data || {}) as Record<string, unknown>

  // Try to extract scores from various possible structures
  const overallScores: OverallScores = {
    seo_score: 0,
    aeo_score: 0,
    geo_score: 0,
  }

  // Check for new format: overall_scores
  if (mdFindings.overall_scores && typeof mdFindings.overall_scores === 'object') {
    const scores = mdFindings.overall_scores as Record<string, unknown>
    overallScores.seo_score = typeof scores.seo_score === 'number' ? scores.seo_score : (typeof scores.seo === 'number' ? scores.seo : 0)
    overallScores.aeo_score = typeof scores.aeo_score === 'number' ? scores.aeo_score : (typeof scores.aeo === 'number' ? scores.aeo : 0)
    overallScores.geo_score = typeof scores.geo_score === 'number' ? scores.geo_score : (typeof scores.geo === 'number' ? scores.geo : 0)
  }
  // Check for legacy format: overallScores
  else if (mdFindings.overallScores && typeof mdFindings.overallScores === 'object') {
    const scores = mdFindings.overallScores as Record<string, unknown>
    overallScores.seo_score = typeof scores.seo === 'number' ? scores.seo : 0
    overallScores.aeo_score = typeof scores.aeo === 'number' ? scores.aeo : 0
    overallScores.geo_score = typeof scores.geo === 'number' ? scores.geo : 0
  }

  // Collect all recommended actions from all agents
  const allActions: AgentAction[] = []
  for (const [, result] of context.sub_agent_results) {
    if (result.recommended_actions) {
      allActions.push(...result.recommended_actions)
    }
  }

  // Build 90-day roadmap from recommended actions
  const roadmap = buildRoadmap(allActions)

  // Collect all agent findings
  const agentFindings: Record<string, Record<string, unknown>> = {}
  let agentsCompleted = 0
  let agentsFailed = 0

  for (const [agentName, result] of context.sub_agent_results) {
    agentFindings[agentName] = result.findings && typeof result.findings === 'object'
      ? result.findings as Record<string, unknown>
      : result.data && typeof result.data === 'object'
        ? result.data as Record<string, unknown>
        : {}

    if (result.status === 'success' || result.status === 'partial') {
      agentsCompleted++
    } else {
      agentsFailed++
    }
  }

  return {
    project_id: context.session_id, // Will be replaced with actual project_id if available
    overall_scores: overallScores,
    '90_day_roadmap': roadmap,
    agent_findings: agentFindings,
    all_recommended_actions: allActions,
    meta: {
      session_id: context.session_id,
      execution_mode: context.execution_mode,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      total_tokens_used: totalTokensUsed,
      total_cost_usd: totalCostUsd,
      agents_completed: agentsCompleted,
      agents_failed: agentsFailed,
    },
  }
}

/**
 * Build a 90-day roadmap from all recommended actions.
 *
 * Groups actions by priority and estimated_impact into weekly buckets:
 * - Week 1: Critical + High impact GEO actions
 * - Week 2: Critical + High impact AEO actions
 * - Week 3: Critical + High impact SEO actions
 * - Week 4: Medium impact actions
 * - Week 5-8: Low effort medium actions
 * - Week 9-12: Long-term strategic actions
 */
function buildRoadmap(actions: AgentAction[]): NinetyDayRoadmap {
  const roadmap: NinetyDayRoadmap = {
    week_1: [],
    week_2: [],
    week_3: [],
    week_4: [],
    week_5_to_8: [],
    week_9_to_12: [],
  }

  for (const action of actions) {
    const sight = (action.sight || action.pillar || 'SEO').toUpperCase() as 'SEO' | 'AEO' | 'GEO'
    const impact = action.estimated_impact || action.priority || 'medium'
    const description = action.description || action.action || ''

    const task: RoadmapTask = {
      agent: action.action_id?.split('_')[0] || 'unknown',
      task: description,
      sight: sight === 'ALL' ? 'SEO' : sight as 'SEO' | 'AEO' | 'GEO',
    }

    // Distribute across weeks based on impact + sight
    if (impact === 'critical') {
      // Critical actions: first 3 weeks by sight
      if (sight === 'GEO') roadmap.week_1.push(task)
      else if (sight === 'AEO') roadmap.week_2.push(task)
      else roadmap.week_3.push(task)
    } else if (impact === 'high') {
      if (sight === 'GEO') roadmap.week_1.push(task)
      else if (sight === 'AEO') roadmap.week_2.push(task)
      else roadmap.week_3.push(task)
    } else if (impact === 'medium') {
      roadmap.week_4.push(task)
    } else {
      // Low impact → distribute to later weeks
      if (roadmap.week_5_to_8.length < 5) {
        roadmap.week_5_to_8.push(task)
      } else {
        roadmap.week_9_to_12.push(task)
      }
    }
  }

  return roadmap
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deep merge two objects. For nested objects, recurse.
 * For arrays, concatenate. For primitives, source overwrites target.
 */
function deepMergeObjects(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (key in result) {
      const targetVal = result[key]
      const sourceVal = source[key]
      if (
        targetVal &&
        sourceVal &&
        typeof targetVal === 'object' &&
        typeof sourceVal === 'object' &&
        !Array.isArray(targetVal) &&
        !Array.isArray(sourceVal)
      ) {
        result[key] = deepMergeObjects(
          targetVal as Record<string, unknown>,
          sourceVal as Record<string, unknown>
        )
      } else if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
        // Concatenate arrays from different agents
        result[key] = [...targetVal, ...sourceVal]
      } else {
        // Source overwrites target for primitives
        result[key] = sourceVal
      }
    } else {
      result[key] = source[key]
    }
  }
  return result
}
