/**
 * ROI Calculation Utilities for the Opportunity Queue
 *
 * ROI Score Formula:
 *   roiScore = estimatedScoreGain / max(effortMinutes, 1) * priorityWeight
 *
 * Priority Weights:
 *   critical = 4, high = 3, medium = 2, low = 1
 */

// ── Types ──────────────────────────────────────────────────────────

export interface ActionItemForROI {
  id: string
  estimatedScoreGain: number
  effortMinutes: number
  priority: string
  roiScore: number
  queuePosition: number
  status: string
}

// ── Priority Weight Map ────────────────────────────────────────────

const PRIORITY_WEIGHTS: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

/**
 * Get the numeric weight for a priority level.
 * Defaults to 1 for unknown priorities.
 */
export function getPriorityWeight(priority: string): number {
  return PRIORITY_WEIGHTS[priority.toLowerCase()] ?? 1
}

/**
 * Calculate the ROI score for a single action item.
 *
 * Formula: roiScore = estimatedScoreGain / max(effortMinutes, 1) * priorityWeight
 *
 * Returns the score rounded to 4 decimal places.
 */
export function calculateROIScore(
  estimatedScoreGain: number,
  effortMinutes: number,
  priority: string
): number {
  const weight = getPriorityWeight(priority)
  const effectiveEffort = Math.max(effortMinutes, 1)
  const score = (estimatedScoreGain / effectiveEffort) * weight
  return Math.round(score * 10000) / 10000
}

/**
 * Check if an action item needs its ROI score recalculated.
 * An item needs recalculation if its roiScore is 0 (unset/default)
 * or if the stored score doesn't match the computed score.
 */
export function needsROIRecalc(item: ActionItemForROI): boolean {
  if (item.roiScore === 0) return true
  const computed = calculateROIScore(
    item.estimatedScoreGain,
    item.effortMinutes,
    item.priority
  )
  return Math.abs(computed - item.roiScore) > 0.0001
}

/**
 * Calculate ROI scores for a list of items and return them
 * sorted by roiScore descending, with queuePositions assigned.
 *
 * Items that are completed or dismissed are excluded from
 * queue positioning.
 */
export function rankAndPositionItems<T extends ActionItemForROI>(
  items: T[]
): { item: T; roiScore: number; queuePosition: number }[] {
  // Calculate ROI for each item
  const withROI = items.map((item) => ({
    item,
    roiScore: calculateROIScore(
      item.estimatedScoreGain,
      item.effortMinutes,
      item.priority
    ),
  }))

  // Sort by ROI descending
  withROI.sort((a, b) => b.roiScore - a.roiScore)

  // Assign queue positions (1 = highest ROI)
  return withROI.map((entry, index) => ({
    ...entry,
    queuePosition: index + 1,
  }))
}

/**
 * Statuses that are considered "active" in the queue
 * (i.e., not yet completed or dismissed).
 */
export const ACTIVE_QUEUE_STATUSES = [
  'pending',
  'queued',
  'in_progress',
  'auto_executing',
] as const

/**
 * All valid statuses for an action item.
 */
export const VALID_STATUSES = [
  'pending',
  'queued',
  'in_progress',
  'completed',
  'dismissed',
  'auto_executing',
  'auto_executed',
  'auto_failed',
] as const
