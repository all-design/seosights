/**
 * Correlation ID Generator
 *
 * Every API request gets a unique x-request-id header.
 * This allows tracing a single request across:
 * - API logs
 * - Fallback events
 * - Error reports
 * - User support tickets
 *
 * Usage: When a user reports a problem, ask for the x-request-id.
 * Search logs for that ID and find everything instantly.
 */

export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${timestamp}-${random}`
}
