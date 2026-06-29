/**
 * Fallback Logger — The "No Silent Fallback" System
 *
 * Level 2: API returns fallback with status indicator
 * Level 3: Every fallback situation is LOGGED with full context
 *
 * This is the single most important operational tool:
 * It ensures that NO fallback is ever silent.
 *
 * Every time a fallback is used, it writes:
 * - API endpoint
 * - Reason (e.g. "Table missing", "Connection timeout")
 * - Timestamp
 * - Stack trace
 * - Correlation ID (if available)
 * - Confidence score (0 = pure fallback, 100 = live data)
 *
 * Logs are stored in-memory ring buffer AND written to console
 * for external log aggregation (Datadog, Sentry, etc.)
 */

export interface FallbackLogEntry {
  id: string
  timestamp: string
  api: string
  reason: string
  category: 'db_missing_table' | 'db_connection' | 'db_query' | 'ai_provider' | 'redis' | 'stripe' | 'external_api' | 'validation' | 'unknown'
  confidence: number // 0-100, 0 = pure fallback, 100 = live
  correlationId?: string
  stack?: string
  metadata?: Record<string, unknown>
}

// ── In-memory ring buffer (last 1000 fallback events) ──────────────────────

const MAX_ENTRIES = 1000
const fallbackBuffer: FallbackLogEntry[] = []

let fallbackIdCounter = 0

function generateFallbackId(): string {
  fallbackIdCounter++
  return `fb-${Date.now()}-${fallbackIdCounter}`
}

/**
 * Log a fallback event. This is the core function.
 * Call this EVERY TIME a fallback value is returned instead of live data.
 */
export function logFallback(params: {
  api: string
  reason: string
  category: FallbackLogEntry['category']
  confidence?: number
  correlationId?: string
  error?: unknown
  metadata?: Record<string, unknown>
}): FallbackLogEntry {
  const entry: FallbackLogEntry = {
    id: generateFallbackId(),
    timestamp: new Date().toISOString(),
    api: params.api,
    reason: params.reason,
    category: params.category,
    confidence: params.confidence ?? 0,
    correlationId: params.correlationId,
    stack: params.error instanceof Error ? params.error.stack?.substring(0, 500) : undefined,
    metadata: params.metadata,
  }

  // Add to ring buffer
  if (fallbackBuffer.length >= MAX_ENTRIES) {
    fallbackBuffer.shift()
  }
  fallbackBuffer.push(entry)

  // Console log for external aggregation (structured JSON)
  console.warn(JSON.stringify({
    level: 'FALLBACK',
    ...entry,
  }))

  return entry
}

/**
 * Get recent fallback logs (for Operations Center dashboard)
 */
export function getFallbackLogs(limit = 100, offset = 0): FallbackLogEntry[] {
  return fallbackBuffer.slice(-(limit + offset)).slice(0, limit).reverse()
}

/**
 * Get fallback statistics (for Operations Center dashboard)
 */
export function getFallbackStats(): {
  total: number
  last24h: number
  last1h: number
  byCategory: Record<string, number>
  byApi: Record<string, number>
  fallbackRate: number // percentage of recent requests that used fallback
} {
  const now = Date.now()
  const oneHourAgo = now - 3600000
  const oneDayAgo = now - 86400000

  const last24h = fallbackBuffer.filter(e => new Date(e.timestamp).getTime() > oneDayAgo).length
  const last1h = fallbackBuffer.filter(e => new Date(e.timestamp).getTime() > oneHourAgo).length

  const byCategory: Record<string, number> = {}
  const byApi: Record<string, number> = {}
  for (const entry of fallbackBuffer) {
    byCategory[entry.category] = (byCategory[entry.category] || 0) + 1
    byApi[entry.api] = (byApi[entry.api] || 0) + 1
  }

  return {
    total: fallbackBuffer.length,
    last24h,
    last1h,
    byCategory,
    byApi,
    fallbackRate: fallbackBuffer.length > 0 ? Math.round((last1h / Math.max(fallbackBuffer.length, 1)) * 1000) / 10 : 0,
  }
}

/**
 * Clear fallback logs (for testing)
 */
export function clearFallbackLogs(): void {
  fallbackBuffer.length = 0
}
