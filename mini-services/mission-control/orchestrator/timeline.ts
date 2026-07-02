// ─── Timeline Event Creator ────────────────────────────────────────

import { db } from '../../../src/lib/db'

export async function createEvent(
  systemName: string,
  eventType: string,
  title: string,
  description?: string,
  icon: string = 'activity',
  color: string = 'default',
  metadata: Record<string, unknown> = {}
) {
  try {
    await db.mCTimelineEvent.create({
      data: {
        systemName,
        eventType,
        title,
        description: description || null,
        icon,
        color,
        metadata: JSON.stringify(metadata),
        timestamp: new Date(),
      },
    })
  } catch (error) {
    console.error('[Timeline] Failed to create event:', error)
  }
}
