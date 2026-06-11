import { db } from '@/lib/db'

// Cost per 1 token (based on per-million-token pricing from providers)
// gpt-4o:        $5/M input,  $15/M output  → 0.000005 / 0.000015
// claude-3.5:     $3/M input,  $15/M output  → 0.000003 / 0.000015
// deepseek-v3:    $0.14/M in,  $0.28/M out   → 0.00000014 / 0.00000028
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'default':       { input: 0.000005,  output: 0.000015 },     // defaults to gpt-4o pricing
  'gpt-4o':        { input: 0.000005,  output: 0.000015 },     // $5 / $15 per million
  'gpt-4o-mini':   { input: 0.00000015, output: 0.0000006 },   // $0.15 / $0.60 per million
  'claude-3-5-sonnet': { input: 0.000003, output: 0.000015 },  // $3 / $15 per million
  'claude-3.5-sonnet': { input: 0.000003, output: 0.000015 },  // alt key
  'deepseek-v3':   { input: 0.00000014, output: 0.00000028 },  // $0.14 / $0.28 per million — extremely cheap
}

export interface TokenUsageRecord {
  agentId: string
  agentName: string
  model: string
  inputTokens: number
  outputTokens: number
  // Optional fields for TokenUsageLog (per-analysis granularity)
  userId?: string
  projectId?: string
  analysisId?: string
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

  // Calculate cost for a record (prices are per-token, matching provider per-million pricing)
  calculateCost(record: TokenUsageRecord): number {
    const costs = MODEL_COSTS[record.model] || MODEL_COSTS['default']
    const inputCost = record.inputTokens * costs.input
    const outputCost = record.outputTokens * costs.output
    return inputCost + outputCost
  }

  // Get total cost for the session
  getTotalCost(): number {
    return this.records.reduce((sum, r) => sum + this.calculateCost(r), 0)
  }

  // Save all records to the database (upsert TokenUsage for today + create TokenUsageLog per record)
  async saveToDatabase() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const record of this.records) {
      const cost = this.calculateCost(record)

      try {
        // --- Existing: Upsert TokenUsage (aggregated daily per agent+model) ---
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

        // --- New: Create TokenUsageLog (per-analysis granularity) ---
        await db.tokenUsageLog.create({
          data: {
            userId: record.userId ?? null,
            projectId: record.projectId ?? null,
            analysisId: record.analysisId ?? null,
            agentName: record.agentName,
            modelUsed: record.model,
            promptTokens: record.inputTokens,
            completionTokens: record.outputTokens,
            costUsd: cost,
          }
        })
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
