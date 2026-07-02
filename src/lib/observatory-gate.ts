/**
 * Observatory Gate — Production data integrity utilities.
 *
 * In production, we MUST filter out simulated/seed data so only real
 * crawl data is ever exposed. In development we show everything for
 * easier debugging and local testing.
 */

import { NextResponse } from 'next/server'

/**
 * Returns true when the app is running in the production NODE_ENV.
 * Used by API routes to conditionally filter `isSimulated` records.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * In production, removes items where `isSimulated === true` from the array.
 * In development, returns all items unchanged — simulated data is visible for debugging.
 */
export function filterSimulated<T extends { isSimulated?: boolean }>(items: T[]): T[] {
  if (isProduction()) {
    return items.filter((item) => item.isSimulated !== true)
  }
  return items
}

/**
 * In production, blocks a single item if `isSimulated === true`.
 * In development, always allows the item through.
 */
export function blockSimulated(item: { isSimulated?: boolean }): { allowed: boolean; error?: string } {
  if (isProduction() && item.isSimulated === true) {
    return { allowed: false, error: 'Simulated data cannot be served in production' }
  }
  return { allowed: true }
}

/**
 * Creates a standardised 403 NextResponse for production gate violations.
 */
export function createProductionGateResponse(error: string): NextResponse {
  return NextResponse.json(
    { error, mode: 'production_gate' },
    { status: 403 }
  )
}

/**
 * Returns a Prisma `where` fragment that filters out simulated records
 * in production but returns an empty filter in development.
 *
 * Usage:
 * ```ts
 * const results = await db.someModel.findMany({
 *   where: {
 *     ...productionGate(),
 *     // other filters...
 *   },
 * })
 * ```
 */
export function productionGate(): { isSimulated: false } | Record<string, never> {
  return isProduction() ? { isSimulated: false } : {} as Record<string, never>
}
