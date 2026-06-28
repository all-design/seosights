/**
 * Safe Database Query Helper — Enhanced with Confidence & Status
 *
 * Three levels of safety:
 * - Level 1: Frontend never crashes (UI handles gracefully)
 * - Level 2: API returns fallback with status indicator (live/fallback/estimated)
 * - Level 3: Every fallback is logged with full context via fallback-logger
 *
 * Every function now returns a SafeResult<T> with:
 * - data: the actual result (or fallback)
 * - status: 'live' | 'fallback' | 'estimated'
 * - confidence: 0-100 (0 = pure fallback, 100 = verified live data)
 * - fallbackReason: why fallback was used (if applicable)
 */

import { db } from '@/lib/db'
import { logFallback } from '@/lib/fallback-logger'

// ── Result Types ────────────────────────────────────────────────────────────

export type DataStatus = 'live' | 'fallback' | 'estimated'

export interface SafeResult<T> {
  data: T
  status: DataStatus
  confidence: number // 0-100
  fallbackReason?: string
}

// ── Core: safeQuery ─────────────────────────────────────────────────────────

/**
 * Safely execute a Prisma query with full fallback logging.
 * Returns SafeResult<T> with status and confidence indicators.
 */
export async function safeQuery<T>(
  queryFn: (db: typeof import('@/lib/db').db) => Promise<T>,
  fallback: T,
  options?: {
    api?: string
    confidence?: number
    correlationId?: string
  }
): Promise<SafeResult<T>> {
  try {
    const result = await queryFn(db)
    return {
      data: result,
      status: 'live',
      confidence: options?.confidence ?? 100,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const reason = msg.substring(0, 200)

    // Determine category from error message
    const category = msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('no such table')
      ? 'db_missing_table' as const
      : msg.toLowerCase().includes('connection') || msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('econnrefused')
        ? 'db_connection' as const
        : 'db_query' as const

    // LOG THE FALLBACK — This is the key: no silent fallbacks!
    logFallback({
      api: options?.api || 'unknown',
      reason,
      category,
      confidence: 0,
      correlationId: options?.correlationId,
      error,
    })

    return {
      data: fallback,
      status: 'fallback',
      confidence: 0,
      fallbackReason: reason,
    }
  }
}

// ── Legacy compatible: safeQuerySimple ──────────────────────────────────────

/**
 * Simple safeQuery that returns just the value (backward compatible).
 * Still logs fallbacks but doesn't wrap in SafeResult.
 * Prefer safeQuery() for new code.
 */
export async function safeQuerySimple<T>(
  queryFn: (db: typeof import('@/lib/db').db) => Promise<T>,
  fallback: T,
  api?: string
): Promise<T> {
  const result = await safeQuery(queryFn, fallback, { api })
  return result.data
}

// ── Safe Count ──────────────────────────────────────────────────────────────

export async function safeCount(
  model: keyof typeof db,
  where?: Record<string, unknown>,
  api?: string
): Promise<SafeResult<number>> {
  return safeQuery(
    (d) => (d[model] as { count: (args?: { where?: Record<string, unknown> }) => Promise<number> }).count({ where }),
    0,
    { api, confidence: 95 }
  )
}

// ── Safe FindMany ───────────────────────────────────────────────────────────

export async function safeFindMany(
  model: keyof typeof db,
  args: Record<string, unknown> = {},
  api?: string
): Promise<SafeResult<unknown[]>> {
  return safeQuery(
    (d) => (d[model] as { findMany: (args: Record<string, unknown>) => Promise<unknown[]> }).findMany(args),
    [],
    { api, confidence: 95 }
  )
}

// ── Safe Aggregate ──────────────────────────────────────────────────────────

export async function safeAggregate<T>(
  queryFn: (db: typeof import('@/lib/db').db) => Promise<T>,
  fallback: T,
  api?: string
): Promise<SafeResult<T>> {
  return safeQuery(queryFn, fallback, { api })
}

// ── safeAction: For Mutations (publish, auto-execute, rollback, stripe, webhook) ──

export interface SafeActionResult<T> {
  success: boolean
  data?: T
  error?: string
  status: 'executed' | 'failed' | 'simulated'
  confidence: number
  fallbackReason?: string
}

/**
 * Safely execute a mutation/action (write operation).
 * Unlike safeQuery which returns fallback data, safeAction reports success/failure.
 * On failure, returns { success: false, status: 'failed' } with the error.
 * 
 * Use for: publish, auto-execute, rollback, stripe payments, webhook dispatches
 */
export async function safeAction<T>(
  actionFn: (db: typeof import('@/lib/db').db) => Promise<T>,
  options?: {
    api?: string
    actionType?: string // e.g. 'publish', 'auto_execute', 'stripe_checkout', 'webhook_dispatch'
    correlationId?: string
    simulateOnFailure?: boolean // If true, returns simulated success instead of failure
    simulationData?: T // Data to return on simulation
  }
): Promise<SafeActionResult<T>> {
  try {
    const result = await actionFn(db)
    return {
      success: true,
      data: result,
      status: 'executed',
      confidence: 100,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const reason = msg.substring(0, 200)

    const category = msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('no such table')
      ? 'db_missing_table' as const
      : msg.toLowerCase().includes('connection') || msg.toLowerCase().includes('timeout')
        ? 'db_connection' as const
        : 'db_query' as const

    // LOG THE FAILURE — every failed action is logged
    logFallback({
      api: options?.api || 'unknown',
      reason: `Action failed: ${reason}`,
      category,
      confidence: 0,
      correlationId: options?.correlationId,
      error,
      metadata: { actionType: options?.actionType },
    })

    if (options?.simulateOnFailure && options.simulationData !== undefined) {
      return {
        success: true,
        data: options.simulationData,
        status: 'simulated',
        confidence: 0,
        fallbackReason: reason,
      }
    }

    return {
      success: false,
      error: reason,
      status: 'failed',
      confidence: 0,
      fallbackReason: reason,
    }
  }
}
