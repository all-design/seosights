/**
 * Agent Failure Fallback System
 *
 * When the primary LLM model API fails (429 rate limit, 5xx server error, timeout),
 * automatically switch to a fallback model from the configured chain.
 *
 * Configurable per agent via the AgentPrompt table (fallbackModel field).
 *
 * Since z-ai-web-dev-sdk handles model routing internally, the fallback system
 * currently:
 *   1. Tracks which agents are failing and which models were attempted
 *   2. Provides infrastructure for when multi-model support is added
 *   3. Logs all fallback attempts in AgentLog for the Superadmin panel
 *
 * The fallback is transparent to the user — they never see which model
 * ultimately handled their request.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Model Chain Configuration
// Each primary model maps to an ordered list of fallbacks to try.
// ─────────────────────────────────────────────────────────────────────────────

export const MODEL_CHAIN: Record<string, string[]> = {
  'default': ['gpt-4o-mini', 'deepseek-v3'],
  'gpt-4o': ['gpt-4o-mini', 'deepseek-v3'],
  'gpt-4o-mini': ['deepseek-v3'],
  'claude-3.5-sonnet': ['gpt-4o-mini', 'deepseek-v3'],
  'deepseek-v3': ['gpt-4o-mini'],
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FallbackLogEntry {
  model: string
  attempt: number
  success: boolean
  error?: string
  timestamp: Date
  latencyMs: number
}

export interface FallbackResult {
  /** Whether any model (primary or fallback) succeeded */
  success: boolean
  /** The model that ultimately succeeded (or last attempted if all failed) */
  model: string
  /** Which attempt number succeeded (1 = primary, 2+ = fallbacks) */
  attempt: number
  /** The raw LLM response data */
  data: Record<string, unknown>
  /** Error message if all attempts failed */
  error?: string
  /** Detailed log of every attempt (primary + fallbacks) */
  logs: FallbackLogEntry[]
  /** Whether a fallback model was used (i.e. primary failed) */
  usedFallback: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Error classification helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine if an error is retryable via a fallback model.
 * Only rate limits (429), server errors (5xx), and timeouts warrant fallback.
 * Client errors (4xx except 429) are programming errors and should not retry.
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message.toLowerCase()

  // 429 / rate limit
  if (
    msg.includes('429') ||
    msg.includes('too many requests') ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit')
  ) {
    return true
  }

  // 5xx server errors
  if (
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('server error') ||
    msg.includes('bad gateway') ||
    msg.includes('service unavailable') ||
    msg.includes('gateway timeout')
  ) {
    return true
  }

  // Timeout / network errors
  if (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('network error') ||
    msg.includes('fetch failed') ||
    msg.includes('aborted')
  ) {
    return true
  }

  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// AgentFallback class
// ─────────────────────────────────────────────────────────────────────────────

export class AgentFallback {
  private primaryModel: string
  private fallbackModels: string[]
  private logs: FallbackLogEntry[] = []

  constructor(primaryModel: string, customFallback?: string) {
    this.primaryModel = primaryModel
    this.fallbackModels = customFallback
      ? [customFallback, ...(MODEL_CHAIN[primaryModel] || [])]
      : MODEL_CHAIN[primaryModel] || MODEL_CHAIN['default'] || ['gpt-4o-mini']
  }

  /**
   * Execute the LLM call with automatic fallback on failure.
   *
   * @param primaryFn   - Function that calls the primary LLM model
   * @param fallbackFn  - Function that calls a fallback model (receives the model name)
   * @param maxAttempts - Total attempts across primary + fallbacks (default 3)
   * @param retryDelay  - Base delay between fallback attempts in ms (default 2000)
   * @returns FallbackResult with data and detailed logs
   */
  async executeWithFallback(
    primaryFn: () => Promise<Record<string, unknown>>,
    fallbackFn: (model: string) => Promise<Record<string, unknown>>,
    maxAttempts: number = 3,
    retryDelay: number = 2000,
  ): Promise<FallbackResult> {
    this.logs = []
    const modelChain = this.getModelChain()

    // Limit attempts to the number of available models
    const totalAttempts = Math.min(maxAttempts, modelChain.length)

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      const model = modelChain[attempt]
      const isPrimary = attempt === 0
      const start = Date.now()

      try {
        console.log(
          `[agent-fallback] Attempt ${attempt + 1}/${totalAttempts} with model "${model}"${isPrimary ? ' (primary)' : ' (fallback)'}`
        )

        const data = isPrimary
          ? await primaryFn()
          : await fallbackFn(model)

        const latencyMs = Date.now() - start

        this.logs.push({
          model,
          attempt: attempt + 1,
          success: true,
          latencyMs,
          timestamp: new Date(),
        })

        console.log(
          `[agent-fallback] Model "${model}" succeeded on attempt ${attempt + 1} (${latencyMs}ms)${!isPrimary ? ' [FALLBACK USED]' : ''}`
        )

        return {
          success: true,
          model,
          attempt: attempt + 1,
          data,
          logs: this.logs,
          usedFallback: !isPrimary,
        }
      } catch (error: unknown) {
        const latencyMs = Date.now() - start
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        this.logs.push({
          model,
          attempt: attempt + 1,
          success: false,
          error: errorMessage,
          latencyMs,
          timestamp: new Date(),
        })

        console.warn(
          `[agent-fallback] Model "${model}" failed on attempt ${attempt + 1}: ${errorMessage} (${latencyMs}ms)`
        )

        // If the error is not retryable, don't try fallbacks — it's a logic error
        if (!isRetryableError(error)) {
          console.error(`[agent-fallback] Non-retryable error, skipping fallbacks: ${errorMessage}`)
          return {
            success: false,
            model,
            attempt: attempt + 1,
            data: {},
            error: `Non-retryable error: ${errorMessage}`,
            logs: this.logs,
            usedFallback: false,
          }
        }

        // If we have more models to try, wait before retrying
        if (attempt < totalAttempts - 1) {
          const delay = retryDelay * Math.pow(1.5, attempt) + Math.random() * 500
          console.log(
            `[agent-fallback] Waiting ${Math.round(delay)}ms before trying next fallback model...`
          )
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // All attempts exhausted
    const lastLog = this.logs[this.logs.length - 1]
    const allErrors = this.logs
      .filter((l) => !l.success)
      .map((l) => `${l.model}: ${l.error}`)
      .join('; ')

    console.error(
      `[agent-fallback] All ${totalAttempts} attempts exhausted. Errors: ${allErrors}`
    )

    return {
      success: false,
      model: lastLog?.model || this.primaryModel,
      attempt: totalAttempts,
      data: {},
      error: `All models exhausted: ${allErrors}`,
      logs: this.logs,
      usedFallback: false,
    }
  }

  /**
   * Get the full model chain: primary model first, then fallbacks.
   */
  getModelChain(): string[] {
    return [this.primaryModel, ...this.fallbackModels]
  }

  /**
   * Get just the fallback models (excluding primary).
   */
  getFallbackModels(): string[] {
    return [...this.fallbackModels]
  }

  /**
   * Get the primary model name.
   */
  getPrimaryModel(): string {
    return this.primaryModel
  }

  /**
   * Get the detailed log entries from the last execution.
   */
  getLogs(): FallbackLogEntry[] {
    return [...this.logs]
  }

  /**
   * Create a summary string for logging / AgentLog.
   * E.g. "default→gpt-4o-mini (attempt 2/3, fallback used)"
   */
  getAttemptSummary(): string {
    if (this.logs.length === 0) return 'No attempts recorded'
    const models = this.logs.map((l) => l.model).join('→')
    const lastLog = this.logs[this.logs.length - 1]
    const fallbackNote = lastLog.attempt > 1 ? ', fallback used' : ''
    return `${models} (attempt ${lastLog.attempt}/${this.getModelChain().length}${fallbackNote})`
  }
}
