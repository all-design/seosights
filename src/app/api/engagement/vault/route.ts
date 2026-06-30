import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'
    const now = new Date()

    const items = await db.engagementVaultItem.findMany({
      where: { domain },
      orderBy: [{ isUnlocked: 'desc' }, { unlockAt: 'asc' }],
    })

    // Add time-until-unlock for locked items
    const enriched = items.map((item) => ({
      ...item,
      unlocksInMs: item.isUnlocked
        ? 0
        : Math.max(0, item.unlockAt.getTime() - now.getTime()),
      unlocksInHuman: item.isUnlocked
        ? 'Unlocked'
        : formatRemaining(Math.max(0, item.unlockAt.getTime() - now.getTime())),
    }))

    const unlocked = enriched.filter((i) => i.isUnlocked)
    const locked = enriched.filter((i) => !i.isUnlocked)

    return NextResponse.json({
      items: enriched,
      unlocked,
      locked,
    })
  } catch (error) {
    console.error('[engagement/vault] Error:', error)
    return NextResponse.json({ error: 'Failed to load vault' }, { status: 500 })
  }
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Now'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`
  return `${Math.floor(ms / 60000)}m`
}
