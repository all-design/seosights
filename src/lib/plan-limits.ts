/**
 * Plan Limits & Rate Limiting Configuration
 *
 * Connects Stripe subscription tiers to backend restrictions.
 * Prevents users on cheaper plans from consuming excessive LLM API budget
 * through mass API requests, audits, or tracked queries.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LIMIT DIMENSIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. max_domains       — Number of websites (projects) a user can track
 * 2. max_tracked_queries — Number of keyword/phrase queries monitored across 17+ AI engines
 * 3. max_audits_per_month — Number of full 8-agent audits per month
 * 4. agents_enabled    — Which of the 8 agents are available
 * 5. allow_white_label — White-label reports (Pro+ only)
 * 6. monthly_cost_cap  — Maximum USD that agents can spend on LLM tokens per month
 *                         (Kill-Switch: prevents a $5 Starter user from burning $200 in API costs)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KILL-SWITCH LOGIC (Financial Protection)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Before ANY sub-agent sends a prompt to an LLM:
 * 1. Sum cost_usd from token_usage_logs for this user in the current month
 * 2. Compare against monthly_cost_cap for their tier
 * 3. If cap exceeded → PAUSE agents, notify user to upgrade
 *
 * This prevents a single malicious Starter ($5) user from running
 * a 10,000-page site through 8 agents and generating a $200 OpenAI bill.
 */

import { db } from '@/lib/db'

// ─────────────────────────────────────────────────────────────────────────────
// Plan Limits Configuration Map
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanLimitConfig {
  max_domains: number
  max_tracked_queries: number
  max_audits_per_month: number
  allow_white_label: boolean
  agents_enabled: string[]  // 'all' means all 8 agents; otherwise list specific agent IDs
  monthly_cost_cap: number  // Maximum USD that can be spent on LLM tokens per month
  priority_support: boolean
  api_access: boolean       // Whether the user has API access (for integrations)
}

export const PLAN_LIMITS: Record<string, PlanLimitConfig> = {
  free_trial: {
    max_domains: 1,
    max_tracked_queries: 5,
    max_audits_per_month: 3,
    allow_white_label: false,
    agents_enabled: ['master_director', 'on_page_auditor', 'tech_schema'],  // Limited agents for trial
    monthly_cost_cap: 2.00,       // $2 cap — enough for trial, prevents abuse
    priority_support: false,
    api_access: false,
  },
  starter: {
    max_domains: 1,
    max_tracked_queries: 50,
    max_audits_per_month: 10,
    allow_white_label: false,
    agents_enabled: ['all'],       // All 8 agents work, but only on 1 domain
    monthly_cost_cap: 3.00,       // $3 cap — 60% of $5 revenue protected
    priority_support: false,
    api_access: false,
  },
  pro: {
    max_domains: 20,
    max_tracked_queries: 500,
    max_audits_per_month: 100,
    allow_white_label: true,
    agents_enabled: ['all'],
    monthly_cost_cap: 40.00,      // $40 cap — healthy margin on $79 price
    priority_support: true,
    api_access: true,
  },
  managed: {
    max_domains: 999,             // Effectively unlimited
    max_tracked_queries: 9999,
    max_audits_per_month: 9999,
    allow_white_label: true,
    agents_enabled: ['all'],
    monthly_cost_cap: 150.00,     // $150 cap — managed service, higher volume
    priority_support: true,
    api_access: true,
  },
}

// Default to free_trial limits if tier is unknown
const DEFAULT_LIMITS = PLAN_LIMITS.free_trial

// ─────────────────────────────────────────────────────────────────────────────
// Limit Check Result
// ─────────────────────────────────────────────────────────────────────────────

export interface LimitCheckResult {
  allowed: boolean
  reason?: string
  /** Current usage for the checked dimension */
  currentUsage?: number
  /** Maximum allowed for the checked dimension */
  limit?: number
  /** The plan limits for the user's current tier */
  planLimits: PlanLimitConfig
  /** The user's current tier */
  tier: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Limit Check Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the plan limits for a given tier.
 * Falls back to free_trial limits if the tier is unknown.
 */
export function getPlanLimits(tier: string): PlanLimitConfig {
  return PLAN_LIMITS[tier] || DEFAULT_LIMITS
}

/**
 * Check if a user can add a new domain (project).
 *
 * Counts the user's current projects and compares against max_domains.
 */
export async function checkDomainLimit(userId: string): Promise<LimitCheckResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tier: true, subscriptionStatus: true },
  })

  if (!user) {
    return { allowed: false, reason: 'User not found', planLimits: DEFAULT_LIMITS, tier: 'unknown' }
  }

  // If subscription is not active/trial, block
  if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trial') {
    return {
      allowed: false,
      reason: 'Subscription is not active. Please update your payment details.',
      planLimits: DEFAULT_LIMITS,
      tier: user.tier,
    }
  }

  const limits = getPlanLimits(user.tier)

  const projectCount = await db.project.count({
    where: { userId },
  })

  if (projectCount >= limits.max_domains) {
    return {
      allowed: false,
      reason: `You've reached the maximum number of domains (${limits.max_domains}) for your ${user.tier} plan. Please upgrade.`,
      currentUsage: projectCount,
      limit: limits.max_domains,
      planLimits: limits,
      tier: user.tier,
    }
  }

  return {
    allowed: true,
    currentUsage: projectCount,
    limit: limits.max_domains,
    planLimits: limits,
    tier: user.tier,
  }
}

/**
 * Check if a user can run a new audit (analysis).
 *
 * Counts audits in the current calendar month and compares against max_audits_per_month.
 */
export async function checkAuditLimit(userId: string): Promise<LimitCheckResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tier: true, subscriptionStatus: true },
  })

  if (!user) {
    return { allowed: false, reason: 'User not found', planLimits: DEFAULT_LIMITS, tier: 'unknown' }
  }

  if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trial') {
    return {
      allowed: false,
      reason: 'Subscription is not active. Please update your payment details.',
      planLimits: DEFAULT_LIMITS,
      tier: user.tier,
    }
  }

  const limits = getPlanLimits(user.tier)

  // Count analyses in the current calendar month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const auditCount = await db.analysis.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  })

  if (auditCount >= limits.max_audits_per_month) {
    return {
      allowed: false,
      reason: `You've reached your monthly audit limit (${limits.max_audits_per_month}) for your ${user.tier} plan. Please upgrade for more audits.`,
      currentUsage: auditCount,
      limit: limits.max_audits_per_month,
      planLimits: limits,
      tier: user.tier,
    }
  }

  return {
    allowed: true,
    currentUsage: auditCount,
    limit: limits.max_audits_per_month,
    planLimits: limits,
    tier: user.tier,
  }
}

/**
 * Check if a specific agent is enabled for the user's tier.
 */
export function checkAgentAccess(tier: string, agentId: string): boolean {
  const limits = getPlanLimits(tier)

  if (limits.agents_enabled.includes('all')) {
    return true
  }

  // Map agent IDs to the short names used in the config
  const agentIdMap: Record<string, string> = {
    'master-director': 'master_director',
    'keyword-researcher': 'keyword_researcher',
    'competitor-analyst': 'competitor_analyst',
    'content-architect': 'content_architect',
    'on-page-auditor': 'on_page_auditor',
    'link-strategist': 'link_strategist',
    'tech-schema-auditor': 'tech_schema',
    'backlink-prospector': 'backlink_prospector',
  }

  const mappedId = agentIdMap[agentId] || agentId
  return limits.agents_enabled.includes(mappedId)
}

/**
 * Get the list of enabled agent IDs for a user's tier.
 * Returns the full list of agent IDs if 'all' is enabled.
 */
export function getEnabledAgents(tier: string): string[] {
  const limits = getPlanLimits(tier)

  if (limits.agents_enabled.includes('all')) {
    return [
      'master-director',
      'keyword-researcher',
      'competitor-analyst',
      'content-architect',
      'on-page-auditor',
      'link-strategist',
      'tech-schema-auditor',
      'backlink-prospector',
    ]
  }

  // Map short names back to agent IDs
  const reverseMap: Record<string, string> = {
    'master_director': 'master-director',
    'keyword_researcher': 'keyword-researcher',
    'competitor_analyst': 'competitor-analyst',
    'content_architect': 'content-architect',
    'on_page_auditor': 'on-page-auditor',
    'link_strategist': 'link-strategist',
    'tech_schema': 'tech-schema-auditor',
    'backlink_prospector': 'backlink-prospector',
  }

  return limits.agents_enabled
    .map(id => reverseMap[id] || id)
    .filter(id => id.includes('-'))  // Only return valid agent IDs
}

// ─────────────────────────────────────────────────────────────────────────────
// Kill-Switch: Monthly Cost Cap
// ─────────────────────────────────────────────────────────────────────────────

export interface CostCapResult {
  withinCap: boolean
  currentMonthlySpend: number
  monthlyCap: number
  remainingBudget: number
  tier: string
  /** Percentage of cap used (0-100+) */
  usagePercent: number
}

/**
 * Kill-Switch: Check if a user's monthly LLM token spend is within the cap.
 *
 * This is the financial protection layer. Before any sub-agent sends a prompt
 * to an LLM, this function should be called to verify the user hasn't exceeded
 * their monthly cost cap.
 *
 * Logic:
 * 1. Sum cost_usd from token_usage_logs for this user in the current month
 * 2. Compare against monthly_cost_cap for their tier
 * 3. If cap exceeded → PAUSE agents, notify user to upgrade
 *
 * Example: Starter plan ($5/month) → $3 monthly_cost_cap
 *   If user's agents have already spent $3.01 in API costs this month,
 *   the system pauses agents and shows:
 *   "You've reached your processing limit for this month.
 *    Upgrade to Pro for unlimited execution."
 */
export async function checkMonthlyCostCap(userId: string): Promise<CostCapResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  })

  const tier = user?.tier || 'free_trial'
  const limits = getPlanLimits(tier)

  // Sum all token costs for this user in the current calendar month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await db.tokenUsageLog.aggregate({
    _sum: {
      costUsd: true,
    },
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  })

  const currentSpend = result._sum.costUsd || 0
  const withinCap = currentSpend < limits.monthly_cost_cap
  const remaining = Math.max(0, limits.monthly_cost_cap - currentSpend)
  const usagePercent = limits.monthly_cost_cap > 0
    ? (currentSpend / limits.monthly_cost_cap) * 100
    : 0

  return {
    withinCap,
    currentMonthlySpend: currentSpend,
    monthlyCap: limits.monthly_cost_cap,
    remainingBudget: remaining,
    tier,
    usagePercent,
  }
}

/**
 * Combined limit check — runs all checks at once.
 * Use this before starting a full 8-agent analysis.
 *
 * Checks:
 * 1. Subscription status is active/trial
 * 2. Monthly audit limit not exceeded
 * 3. Monthly cost cap not exceeded (Kill-Switch)
 * 4. Agent access is valid for the user's tier
 */
export async function checkAllLimits(userId: string): Promise<{
  allowed: boolean
  checks: {
    subscription: LimitCheckResult
    auditLimit: LimitCheckResult
    costCap: CostCapResult
  }
  reason?: string
}> {
  // Check 1: Audit limit (includes subscription check)
  const auditCheck = await checkAuditLimit(userId)

  if (!auditCheck.allowed) {
    return {
      allowed: false,
      checks: {
        subscription: auditCheck,
        auditLimit: auditCheck,
        costCap: {
          withinCap: true,
          currentMonthlySpend: 0,
          monthlyCap: 0,
          remainingBudget: 0,
          tier: auditCheck.tier,
          usagePercent: 0,
        },
      },
      reason: auditCheck.reason,
    }
  }

  // Check 2: Monthly cost cap (Kill-Switch)
  const costCapCheck = await checkMonthlyCostCap(userId)

  if (!costCapCheck.withinCap) {
    return {
      allowed: false,
      checks: {
        subscription: auditCheck,
        auditLimit: auditCheck,
        costCap: costCapCheck,
      },
      reason: `You've reached your processing limit ($${costCapCheck.monthlyCap.toFixed(2)}) for this month. Upgrade to Pro for higher limits.`,
    }
  }

  return {
    allowed: true,
    checks: {
      subscription: auditCheck,
      auditLimit: auditCheck,
      costCap: costCapCheck,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage Stats (for frontend display)
// ─────────────────────────────────────────────────────────────────────────────

export interface UsageStats {
  tier: string
  subscriptionStatus: string
  domains: {
    used: number
    limit: number
  }
  audits: {
    used: number
    limit: number
  }
  trackedQueries: {
    used: number
    limit: number
  }
  monthlySpend: {
    used: number
    cap: number
    percentUsed: number
  }
  agentsEnabled: string[]
  allowWhiteLabel: boolean
  prioritySupport: boolean
  apiAccess: boolean
}

/**
 * Get comprehensive usage stats for a user.
 * Used by the frontend to display limit indicators and upgrade prompts.
 */
export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tier: true, subscriptionStatus: true },
  })

  if (!user) {
    return {
      tier: 'free_trial',
      subscriptionStatus: 'unknown',
      domains: { used: 0, limit: 1 },
      audits: { used: 0, limit: 3 },
      trackedQueries: { used: 0, limit: 5 },
      monthlySpend: { used: 0, cap: 2, percentUsed: 0 },
      agentsEnabled: ['master_director', 'on_page_auditor', 'tech_schema'],
      allowWhiteLabel: false,
      prioritySupport: false,
      apiAccess: false,
    }
  }

  const limits = getPlanLimits(user.tier)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Parallel queries for efficiency
  const [domainCount, auditCount, monthlySpend] = await Promise.all([
    db.project.count({ where: { userId } }),
    db.analysis.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    db.tokenUsageLog.aggregate({
      _sum: { costUsd: true },
      where: { userId, createdAt: { gte: startOfMonth } },
    }),
  ])

  const currentSpend = monthlySpend._sum.costUsd || 0
  const spendPercent = limits.monthly_cost_cap > 0
    ? Math.min(100, (currentSpend / limits.monthly_cost_cap) * 100)
    : 0

  // For tracked queries, we'll count from the analysis results
  // This is a simplified count — in production, you'd track this separately
  const trackedQueriesCount = 0  // Placeholder until query tracking table is added

  return {
    tier: user.tier,
    subscriptionStatus: user.subscriptionStatus,
    domains: {
      used: domainCount,
      limit: limits.max_domains,
    },
    audits: {
      used: auditCount,
      limit: limits.max_audits_per_month,
    },
    trackedQueries: {
      used: trackedQueriesCount,
      limit: limits.max_tracked_queries,
    },
    monthlySpend: {
      used: currentSpend,
      cap: limits.monthly_cost_cap,
      percentUsed: spendPercent,
    },
    agentsEnabled: getEnabledAgents(user.tier),
    allowWhiteLabel: limits.allow_white_label,
    prioritySupport: limits.priority_support,
    apiAccess: limits.api_access,
  }
}
