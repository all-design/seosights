import { db } from '@/lib/db'

// Cost per 1K tokens (approximate, update as needed)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'default': { input: 0.002, output: 0.008 },  // GPT-4o-mini approx
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'claude-3.5-sonnet': { input: 0.003, output: 0.015 },
  'deepseek-v3': { input: 0.00027, output: 0.0011 },
}

export interface TokenUsageRecord {
  agentId: string
  agentName: string
  model: string
  inputTokens: number
  outputTokens: number
}

export class TokenTracker {
  private sessionId: string
  private records: TokenUsageRecord[] = []

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  // Track a single LLM call
  track(record: TokenUsageRecord) {
    this.records.push(record)
  }

  // Estimate token count from text (rough: 1 token ≈ 4 chars)
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  // Calculate cost for a record
  calculateCost(record: TokenUsageRecord): number {
    const costs = MODEL_COSTS[record.model] || MODEL_COSTS['default']
    const inputCost = (record.inputTokens / 1000) * costs.input
    const outputCost = (record.outputTokens / 1000) * costs.output
    return inputCost + outputCost
  }

  // Get total cost for the session
  getTotalCost(): number {
    return this.records.reduce((sum, r) => sum + this.calculateCost(r), 0)
  }

  // Save all records to the database (upsert TokenUsage for today)
  async saveToDatabase() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const record of this.records) {
      const cost = this.calculateCost(record)

      try {
        // Try to find existing record for today+agent+model
        const existing = await db.tokenUsage.findFirst({
          where: {
            date: today,
            agentId: record.agentId,
            model: record.model,
          }
        })

        if (existing) {
          await db.tokenUsage.update({
            where: { id: existing.id },
            data: {
              totalInputTokens: existing.totalInputTokens + record.inputTokens,
              totalOutputTokens: existing.totalOutputTokens + record.outputTokens,
              totalTokens: existing.totalTokens + record.inputTokens + record.outputTokens,
              estimatedCostUsd: existing.estimatedCostUsd + cost,
              apiCalls: existing.apiCalls + 1,
            }
          })
        } else {
          await db.tokenUsage.create({
            data: {
              date: today,
              agentId: record.agentId,
              agentName: record.agentName,
              model: record.model,
              totalInputTokens: record.inputTokens,
              totalOutputTokens: record.outputTokens,
              totalTokens: record.inputTokens + record.outputTokens,
              estimatedCostUsd: cost,
              apiCalls: 1,
              failures: 0,
            }
          })
        }
      } catch (error) {
        console.error('[token-tracker] Failed to save usage:', error)
      }
    }
  }

  // Track a failure for an agent
  async trackFailure(agentId: string, agentName: string, model: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      const existing = await db.tokenUsage.findFirst({
        where: { date: today, agentId, model }
      })

      if (existing) {
        await db.tokenUsage.update({
          where: { id: existing.id },
          data: { failures: existing.failures + 1 }
        })
      } else {
        // Create a record with zero tokens but 1 failure
        await db.tokenUsage.create({
          data: {
            date: today,
            agentId,
            agentName,
            model,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalTokens: 0,
            estimatedCostUsd: 0,
            apiCalls: 0,
            failures: 1,
          }
        })
      }
    } catch (error) {
      console.error('[token-tracker] Failed to track failure:', error)
    }
  }

  // Get summary for this session
  getSummary(): { totalTokens: number; totalCost: number; byAgent: Record<string, { tokens: number; cost: number }> } {
    const byAgent: Record<string, { tokens: number; cost: number }> = {}
    let totalTokens = 0

    for (const record of this.records) {
      const cost = this.calculateCost(record)
      const tokens = record.inputTokens + record.outputTokens
      totalTokens += tokens

      if (!byAgent[record.agentId]) {
        byAgent[record.agentId] = { tokens: 0, cost: 0 }
      }
      byAgent[record.agentId].tokens += tokens
      byAgent[record.agentId].cost += cost
    }

    return { totalTokens, totalCost: this.getTotalCost(), byAgent }
  }

  // Get the session ID
  getSessionId(): string {
    return this.sessionId
  }
}
