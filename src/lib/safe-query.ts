/**
 * Safe Database Query Helper
 * 
 * Wraps Prisma queries to gracefully handle missing tables on Turso.
 * If a table doesn't exist (e.g., AnalyticsEvent not yet migrated),
 * returns the fallback value instead of throwing a 500 error.
 */

import { db } from '@/lib/db'

/**
 * Safely execute a Prisma query. If ANY error occurs (missing table, connection, etc.), return fallback.
 * This prevents 500 errors on production when new tables haven't been migrated to Turso yet.
 */
export async function safeQuery<T>(
  queryFn: (db: typeof import('@/lib/db').db) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await queryFn(db)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[safe-query] Query failed, using fallback:', msg.substring(0, 150))
    return fallback
  }
}

/**
 * Safe count — returns 0 if table doesn't exist
 */
export async function safeCount(
  model: keyof typeof db,
  where?: Record<string, unknown>
): Promise<number> {
  return safeQuery(
    (d) => (d[model] as { count: (args?: { where?: Record<string, unknown> }) => Promise<number> }).count({ where }),
    0
  )
}

/**
 * Safe findMany — returns [] if table doesn't exist
 */
export async function safeFindMany(
  model: keyof typeof db,
  args: Record<string, unknown> = {}
): Promise<unknown[]> {
  return safeQuery(
    (d) => (d[model] as { findMany: (args: Record<string, unknown>) => Promise<unknown[]> }).findMany(args),
    []
  )
}

/**
 * Safe aggregate — returns default result if table doesn't exist
 */
export async function safeAggregate<T>(
  queryFn: (db: typeof import('@/lib/db').db) => Promise<T>,
  fallback: T
): Promise<T> {
  return safeQuery(queryFn, fallback)
}
