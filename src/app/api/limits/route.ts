import { NextRequest, NextResponse } from 'next/server'
import { getUserUsageStats, checkAllLimits, checkDomainLimit } from '@/lib/plan-limits'

export const dynamic = 'force-dynamic'

/**
 * GET /api/limits?userId=xxx
 *
 * Returns the user's current usage stats and plan limits.
 * Used by the frontend to display limit indicators, progress bars,
 * and upgrade prompts.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    const stats = await getUserUsageStats(userId)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[limits] Error fetching usage stats:', error)
    return NextResponse.json({ error: 'Failed to fetch usage stats' }, { status: 500 })
  }
}

/**
 * POST /api/limits
 *
 * Check whether a specific action is allowed for a user.
 * Body: { userId, action: 'add_domain' | 'run_audit' | 'run_agent', agentId? }
 *
 * Returns: { allowed, reason?, currentUsage?, limit?, planLimits }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, agentId } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 })
    }

    switch (action) {
      case 'add_domain': {
        const result = await checkDomainLimit(userId)
        return NextResponse.json(result)
      }

      case 'run_audit': {
        const result = await checkAllLimits(userId)
        return NextResponse.json(result)
      }

      case 'run_agent': {
        if (!agentId) {
          return NextResponse.json({ error: 'agentId is required for run_agent action' }, { status: 400 })
        }
        // For agent runs, check audit limit + cost cap
        const result = await checkAllLimits(userId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[limits] Error checking limits:', error)
    return NextResponse.json({ error: 'Failed to check limits' }, { status: 500 })
  }
}
