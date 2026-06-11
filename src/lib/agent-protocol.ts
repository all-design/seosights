/**
 * Hub-and-Spoke Agent Communication Protocol
 *
 * Enforces JSON-strict inter-agent communication with a Master Director
 * orchestrating 7 sub-agents. Every sub-agent MUST return a structured
 * AgentResponse that is validated before being merged into the ContextWindow.
 *
 * Key benefits:
 * - If one agent fails or returns invalid JSON, retry just that agent
 *   without restarting the entire analysis (saves tokens and time)
 * - ContextWindow accumulates knowledge across sub-agent results
 * - Master Director runs a final synthesis pass with full context
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core Protocol Types
// ─────────────────────────────────────────────────────────────────────────────

/** A single recommended action from a sub-agent */
export interface AgentAction {
  action: string
  priority: 'high' | 'medium' | 'low'
  expected_impact: string
  pillar: 'seo' | 'aeo' | 'geo' | 'all'
  effort: 'high' | 'medium' | 'low'
}

/** Agent Response Protocol — all sub-agents MUST return this format */
export interface AgentResponse {
  agent_name: string // e.g. "keyword_researcher"
  status: 'success' | 'partial' | 'error'
  critical_findings: string[]
  recommended_actions: AgentAction[]
  data: Record<string, unknown> // agent-specific structured data
  token_usage: { prompt: number; completion: number }
}

/** Master Director context window — accumulates sub-agent results */
export interface ContextWindow {
  target_url: string
  target_domain: string
  target_market: string
  site_name: string
  scan_data: Record<string, unknown> // raw crawl data
  sub_agent_results: Map<string, AgentResponse>
  merged_knowledge: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate that a raw value conforms to the AgentResponse protocol.
 *
 * Lenient: only checks the REQUIRED top-level fields exist with correct types.
 * Missing optional fields (token_usage, recommended_actions) get defaults.
 * Extra fields are allowed — agents may include additional data.
 */
export function validateAgentResponse(
  raw: unknown
): { valid: boolean; response?: AgentResponse; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Response is not an object' }
  }

  const obj = raw as Record<string, unknown>

  // agent_name is required
  if (!obj.agent_name || typeof obj.agent_name !== 'string') {
    // Lenient: if the response has meaningful data, we can infer agent_name
    // from context. Don't reject outright.
    obj.agent_name = obj.agent_name || 'unknown_agent'
  }

  // status must be one of the valid values
  const validStatuses = ['success', 'partial', 'error']
  if (obj.status && !validStatuses.includes(obj.status as string)) {
    obj.status = 'partial' // Default to partial if invalid status
  }
  if (!obj.status) {
    obj.status = 'partial' // Default
  }

  // critical_findings must be an array of strings (or absent → default [])
  if (obj.critical_findings && !Array.isArray(obj.critical_findings)) {
    obj.critical_findings = []
  }
  if (!obj.critical_findings) {
    obj.critical_findings = []
  }

  // recommended_actions must be an array (or absent → default [])
  if (obj.recommended_actions && !Array.isArray(obj.recommended_actions)) {
    obj.recommended_actions = []
  }
  if (!obj.recommended_actions) {
    obj.recommended_actions = []
  }

  // data must be an object (or absent → default {})
  if (obj.data && typeof obj.data !== 'object') {
    obj.data = {}
  }
  if (!obj.data) {
    // If there's no "data" field but the response has other structured fields
    // (like "audit", "eeat", etc.), we treat the whole object minus protocol
    // fields as the data payload. This is the lenient path that keeps
    // compatibility with existing agents that don't wrap their output.
    const protocolFields = new Set([
      'agent_name',
      'status',
      'critical_findings',
      'recommended_actions',
      'data',
      'token_usage',
    ])
    const dataPayload: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (!protocolFields.has(key)) {
        dataPayload[key] = value
      }
    }
    obj.data = dataPayload
  }

  // token_usage is optional, default to zeros
  if (!obj.token_usage || typeof obj.token_usage !== 'object') {
    obj.token_usage = { prompt: 0, completion: 0 }
  } else {
    const tu = obj.token_usage as Record<string, unknown>
    tu.prompt = typeof tu.prompt === 'number' ? tu.prompt : 0
    tu.completion = typeof tu.completion === 'number' ? tu.completion : 0
  }

  // If there is NO meaningful data at all, mark as error
  const hasData =
    Object.keys(obj.data as Record<string, unknown>).length > 0 ||
    (obj.critical_findings as string[]).length > 0 ||
    (obj.recommended_actions as AgentAction[]).length > 0

  if (!hasData && obj.status !== 'error') {
    // Even with no data, we accept it as "partial" — the system can
    // still proceed with fallbacks. This is the lenient path.
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
 * Build a context string for a specific sub-agent from the ContextWindow.
 *
 * This is injected into the agent's user prompt so it has access to
 * prior agent results and relevant scan data.
 */
export function buildSubAgentContext(
  agentId: string,
  context: ContextWindow
): string {
  const parts: string[] = []

  // Always include target info
  parts.push(`TARGET: ${context.target_url} (${context.site_name})`)
  parts.push(`DOMAIN: ${context.target_domain}`)
  parts.push(`MARKET: ${context.target_market}`)

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

  // Include results from prior agents
  if (context.sub_agent_results.size > 0) {
    parts.push('\nPRIOR AGENT RESULTS:')
    for (const [agentName, result] of context.sub_agent_results) {
      if (agentName === agentId) continue // Don't include own results

      const criticalFindings = result.critical_findings?.slice(0, 5) || []
      const keyActions = result.recommended_actions
        ?.filter((a) => a.priority === 'high')
        .slice(0, 3) || []

      parts.push(`  [${agentName}] status=${result.status}`)
      if (criticalFindings.length > 0) {
        parts.push(`    Critical: ${criticalFindings.join('; ')}`)
      }
      if (keyActions.length > 0) {
        parts.push(
          `    Top Actions: ${keyActions.map((a) => a.action).join('; ')}`
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
    '\nPROTOCOL REMINDER: Return ONLY valid JSON. Include agent_name, status, critical_findings, recommended_actions, and your analysis data.'
  )

  return parts.join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Merging
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge a validated sub-agent result into the ContextWindow.
 *
 * This updates both sub_agent_results and merged_knowledge.
 * The merged_knowledge accumulates the "data" field from each agent,
 * with deep merging for nested objects and array concatenation.
 */
export function mergeSubAgentResult(
  context: ContextWindow,
  result: AgentResponse
): ContextWindow {
  // Store the full result
  context.sub_agent_results.set(result.agent_name, result)

  // Merge the agent's data into merged_knowledge
  if (result.data && typeof result.data === 'object') {
    context.merged_knowledge = deepMergeObjects(
      context.merged_knowledge,
      result.data as Record<string, unknown>
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
}): ContextWindow {
  return {
    target_url: params.url,
    target_domain: params.domain,
    target_market: params.market,
    site_name: params.siteName,
    scan_data: params.scanData || {},
    sub_agent_results: new Map(),
    merged_knowledge: {},
  }
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
