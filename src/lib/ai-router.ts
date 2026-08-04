/**
 * AI Router — Smart Task-Based Model Routing
 *
 * OpenRouter GLM 5.2 / GLM Turbo is the DEFAULT for all tasks.
 * Fallback chain ensures resilience with multiple providers.
 *
 * | Task              | Default Model       | Why                        |
 * |-------------------|---------------------|----------------------------|
 * | scoring           | GLM Turbo (OR)      | Ultra-fast, cheap, good at numbers |
 * | entity_extraction | GLM Turbo (OR)      | Fast, structured output    |
 * | summarization     | GLM Turbo (OR)      | Speed + quality balance    |
 * | long_report       | GLM 5.2 (OR)        | Huge context (1M), state-of-art |
 * | strategy          | GLM 5.2 (OR)        | Best reasoning, 1M context |
 * | code              | GLM Turbo (OR)      | Fast, code-specialized     |
 * | reasoning         | GLM 5.2 (OR)        | Complex chain-of-thought   |
 *
 * Provider Priority (default):
 * 1. OpenRouter GLM 5.2 / GLM Turbo (primary — cheap, reliable, huge context)
 * 2. Groq (free, ultra-fast, Llama 3.1)
 * 3. Google Gemini (free tier, huge context)
 * 4. DeepSeek V3 (via OpenRouter, code/reasoning)
 * 5. OpenAI (paid, highest quality)
 * 6. Ollama (local fallback)
 * 7. ZAI SDK (sandbox-only, LAST resort — doesn't work on Vercel)
 */

import { createOllamaCompletion } from './agent-fallback'
import { TokenTracker } from './token-tracker'
import type OpenAI from 'openai'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TaskType =
  | 'scoring'           // Numeric scoring (AI Visibility Score, Trust Score, etc.)
  | 'entity_extraction' // Extract entities, keywords, topics
  | 'summarization'     // Summarize content, generate insights
  | 'long_report'       // Generate long-form reports, analysis
  | 'strategy'          // Strategic recommendations, action plans
  | 'code'              // Code generation, schema markup
  | 'reasoning'         // Complex chain-of-thought reasoning
  | 'classification'    // Classify content, categorize
  | 'chat'              // General chat / Q&A
  | 'embedding'         // Vector embeddings (future)

export type DataStatus = 'live' | 'estimated' | 'simulation'

export type ProviderId = 'groq' | 'gemini' | 'openrouter' | 'openai' | 'zai' | 'ollama' | 'simulation'

export interface RouterResult {
  content: string
  model: string
  provider: ProviderId
  status: DataStatus
  latencyMs: number
  tokensUsed?: { prompt: number; completion: number }
  costUsd?: number
  fallbackChain?: string[]  // which providers were tried
}

export interface RouterOptions {
  /** Type of task — determines optimal model */
  taskType: TaskType
  /** User tier — determines budget constraints */
  tier?: 'free_trial' | 'starter' | 'pro' | 'managed'
  /** Preferred model override (e.g. from AgentPrompt config) */
  preferredModel?: string
  /** Temperature (0-1) */
  temperature?: number
  /** Maximum tokens for completion */
  maxTokens?: number
  /** Timeout in milliseconds */
  timeout?: number
  /** Whether to allow fallback to simulation data */
  allowSimulation?: boolean
  /** Agent name for token tracking (defaults to taskType) */
  agentName?: string
  /** Force JSON-only output — adds response_format:json_object for supported providers */
  jsonMode?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Registry — Best model per task type
// ─────────────────────────────────────────────────────────────────────────────

interface ModelSpec {
  id: string           // Model identifier for the provider
  provider: ProviderId
  costPer1kInput?: number   // USD per 1K input tokens (0 = free)
  costPer1kOutput?: number  // USD per 1K output tokens (0 = free)
  contextWindow: number     // Max context tokens
  speed: 'ultra' | 'fast' | 'medium' | 'slow'
  quality: 'basic' | 'good' | 'excellent' | 'state_of_art'
  free: boolean
}

const MODEL_REGISTRY: Record<string, ModelSpec> = {
  // ─── Groq (Free Tier — Ultra Fast) ────────────────────────────────────
  'groq/llama-3.1-70b': {
    id: 'llama-3.1-70b-versatile',
    provider: 'groq',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 131072,
    speed: 'ultra',
    quality: 'excellent',
    free: true,
  },
  'groq/llama-3.1-8b': {
    id: 'llama-3.1-8b-instant',
    provider: 'groq',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 131072,
    speed: 'ultra',
    quality: 'good',
    free: true,
  },
  'groq/mixtral-8x7b': {
    id: 'mixtral-8x7b-32768',
    provider: 'groq',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 32768,
    speed: 'ultra',
    quality: 'good',
    free: true,
  },

  // ─── Google Gemini (Free Tier) ────────────────────────────────────────
  'gemini/flash': {
    id: 'gemini-2.0-flash',
    provider: 'gemini',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 1048576,
    speed: 'fast',
    quality: 'excellent',
    free: true,
  },
  'gemini/pro': {
    id: 'gemini-2.5-pro',
    provider: 'gemini',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 2097152,
    speed: 'medium',
    quality: 'state_of_art',
    free: true,  // Free tier available with limits
  },

  // ─── OpenRouter (Free Models) ─────────────────────────────────────────
  'openrouter/deepseek-v3': {
    id: 'deepseek/deepseek-chat-v3-0324',
    provider: 'openrouter',
    costPer1kInput: 0.00014,
    costPer1kOutput: 0.00028,
    contextWindow: 65536,
    speed: 'fast',
    quality: 'excellent',
    free: false,
  },
  'openrouter/llama-3.1-8b': {
    id: 'meta-llama/llama-3.1-8b-instruct',
    provider: 'openrouter',
    costPer1kInput: 0.00002,
    costPer1kOutput: 0.00006,
    contextWindow: 131072,
    speed: 'fast',
    quality: 'good',
    free: false,
  },
  'openrouter/glm-5.2': {
    id: 'z-ai/glm-5.2',
    provider: 'openrouter',
    costPer1kInput: 0.000001,
    costPer1kOutput: 0.000005,
    contextWindow: 1048576,
    speed: 'medium',
    quality: 'state_of_art',
    free: false,
  },
  'openrouter/glm-turbo': {
    id: 'z-ai/glm-5-turbo',
    provider: 'openrouter',
    costPer1kInput: 0.00000006,
    costPer1kOutput: 0.00000006,
    contextWindow: 202752,
    speed: 'ultra',
    quality: 'excellent',
    free: false,
  },
  'openrouter/glm-5.1': {
    id: 'z-ai/glm-4.7-flash',
    provider: 'openrouter',
    costPer1kInput: 0.00000006,
    costPer1kOutput: 0.00000006,
    contextWindow: 131072,
    speed: 'fast',
    quality: 'excellent',
    free: false,
  },

  // ─── OpenAI (Paid — Highest Quality) ──────────────────────────────────
  'openai/gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    contextWindow: 128000,
    speed: 'fast',
    quality: 'excellent',
    free: false,
  },
  'openai/gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
    contextWindow: 128000,
    speed: 'medium',
    quality: 'state_of_art',
    free: false,
  },

  // ─── ZAI SDK (Sandbox — LAST resort, fails on Vercel) ────────────────
  'zai/default': {
    id: 'default',
    provider: 'zai',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 128000,
    speed: 'medium',
    quality: 'good',
    free: true,
  },

  // ─── Ollama (Local Fallback) ─────────────────────────────────────────
  'ollama/llama3': {
    id: 'llama3',
    provider: 'ollama',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 8192,
    speed: 'slow',
    quality: 'basic',
    free: true,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Task → Optimal Model Mapping
// ─────────────────────────────────────────────────────────────────────────────

const TASK_MODEL_MAP: Record<TaskType, string[]> = {
  scoring:           ['openrouter/glm-turbo', 'openrouter/glm-5.2', 'groq/llama-3.1-8b', 'groq/llama-3.1-70b', 'gemini/flash', 'openrouter/deepseek-v3', 'openai/gpt-4o-mini', 'ollama/llama3', 'zai/default'],
  entity_extraction: ['openrouter/glm-turbo', 'openrouter/glm-5.2', 'groq/llama-3.1-8b', 'groq/llama-3.1-70b', 'gemini/flash', 'openrouter/deepseek-v3', 'openai/gpt-4o-mini', 'ollama/llama3', 'zai/default'],
  summarization:     ['openrouter/glm-turbo', 'openrouter/glm-5.2', 'groq/llama-3.1-8b', 'groq/llama-3.1-70b', 'gemini/flash', 'openrouter/deepseek-v3', 'openai/gpt-4o-mini', 'ollama/llama3', 'zai/default'],
  long_report:       ['groq/llama-3.1-70b', 'openrouter/glm-5.2', 'openrouter/glm-turbo', 'gemini/pro', 'gemini/flash', 'openrouter/deepseek-v3', 'groq/llama-3.1-8b', 'openai/gpt-4o', 'ollama/llama3', 'zai/default'],
  strategy:          ['groq/llama-3.1-70b', 'openrouter/glm-5.2', 'openrouter/glm-turbo', 'openai/gpt-4o', 'gemini/pro', 'openrouter/deepseek-v3', 'groq/llama-3.1-8b', 'ollama/llama3', 'zai/default'],
  code:              ['openrouter/glm-turbo', 'openrouter/deepseek-v3', 'openrouter/glm-5.2', 'groq/llama-3.1-70b', 'gemini/flash', 'openai/gpt-4o-mini', 'groq/llama-3.1-8b', 'ollama/llama3', 'zai/default'],
  reasoning:         ['groq/llama-3.1-70b', 'openrouter/glm-5.2', 'openrouter/glm-turbo', 'openai/gpt-4o', 'gemini/pro', 'openrouter/deepseek-v3', 'groq/llama-3.1-8b', 'ollama/llama3', 'zai/default'],
  classification:    ['openrouter/glm-turbo', 'openrouter/glm-5.2', 'groq/llama-3.1-8b', 'groq/llama-3.1-70b', 'gemini/flash', 'openrouter/deepseek-v3', 'ollama/llama3', 'zai/default'],
  chat:              ['openrouter/glm-turbo', 'openrouter/glm-5.2', 'groq/llama-3.1-8b', 'groq/llama-3.1-70b', 'gemini/flash', 'openai/gpt-4o-mini', 'ollama/llama3', 'zai/default'],
  embedding:         ['gemini/flash', 'openrouter/glm-turbo', 'groq/llama-3.1-8b', 'ollama/llama3', 'zai/default'],
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier → Model Constraints (Smart Budget Engine)
// ─────────────────────────────────────────────────────────────────────────────

const TIER_CONSTRAINTS: Record<string, { allowedProviders: ProviderId[]; maxCostPerCall: number; preferFree: boolean }> = {
  free_trial: { allowedProviders: ['groq', 'gemini', 'openrouter', 'zai', 'ollama'], maxCostPerCall: 0.01, preferFree: true },  // Allow ultra-cheap models (GLM costs ~$0.000001/1k)
  starter:    { allowedProviders: ['groq', 'gemini', 'openrouter', 'zai', 'ollama'], maxCostPerCall: 0.05, preferFree: true },
  pro:        { allowedProviders: ['groq', 'gemini', 'openrouter', 'openai', 'zai', 'ollama'], maxCostPerCall: 0.10, preferFree: false },
  managed:    { allowedProviders: ['groq', 'gemini', 'openrouter', 'openai', 'zai', 'ollama'], maxCostPerCall: 0.50, preferFree: false },
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Call Result Type
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderCallResult {
  content: string
  tokensUsed?: { prompt: number; completion: number }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Clients
// ─────────────────────────────────────────────────────────────────────────────

/** Groq API client — ultra-fast free inference */
async function callGroq(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number; maxTokens?: number }): Promise<ProviderCallResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role === 'system' ? 'system' : m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${body}`)
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  const content = data.choices?.[0]?.message?.content || ''
  const tokensUsed = data.usage?.prompt_tokens != null && data.usage?.completion_tokens != null
    ? { prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens }
    : undefined
  return { content, tokensUsed }
}

/** Google Gemini API client — huge context, free tier */
async function callGemini(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number; maxTokens?: number }): Promise<ProviderCallResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const systemInstruction = messages.find(m => m.role === 'system')

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 8192,
      },
    }),
    signal: AbortSignal.timeout(45000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${body}`)
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  }
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const tokensUsed = data.usageMetadata?.promptTokenCount != null && data.usageMetadata?.candidatesTokenCount != null
    ? { prompt: data.usageMetadata.promptTokenCount, completion: data.usageMetadata.candidatesTokenCount }
    : undefined
  return { content, tokensUsed }
}

/** OpenRouter API client — access to 100+ models */
async function callOpenRouter(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }): Promise<ProviderCallResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')

  const bodyPayload: Record<string, unknown> = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
  }

  // Add JSON response_format when jsonMode is requested
  if (options?.jsonMode) {
    bodyPayload.response_format = { type: 'json_object' }
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://seosights.com',
      'X-Title': 'seosights AI Visibility Platform',
    },
    body: JSON.stringify(bodyPayload),
    signal: AbortSignal.timeout(45000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${body}`)
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  const content = data.choices?.[0]?.message?.content || ''
  const tokensUsed = data.usage?.prompt_tokens != null && data.usage?.completion_tokens != null
    ? { prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens }
    : undefined
  return { content, tokensUsed }
}

/** OpenAI API client — highest quality (paid) */
async function callOpenAI(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number; maxTokens?: number }): Promise<ProviderCallResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const openaiModule = await import('openai')
  const openai = new openaiModule.default({ apiKey })

  const response = await openai.chat.completions.create({
    model,
    messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
  })

  const content = response.choices[0]?.message?.content || ''
  const tokensUsed = response.usage?.prompt_tokens != null && response.usage?.completion_tokens != null
    ? { prompt: response.usage.prompt_tokens, completion: response.usage.completion_tokens }
    : undefined
  return { content, tokensUsed }
}

/** ZAI SDK client — sandbox default */
async function callZAI(messages: Array<{role: string; content: string}>): Promise<ProviderCallResult> {
  const { getZAI } = await import('./zai')
  const zai = await getZAI()
  const result = await zai.chat.completions.create({
    messages: messages as Array<{role: string; content: string}>,
  })
  const content = (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content || ''

  // ZAI SDK doesn't reliably return token usage data, so estimate from text
  // Using the standard heuristic: 1 token ≈ 4 characters
  const inputText = messages.map(m => m.content).join('')
  const estimatedPromptTokens = Math.ceil(inputText.length / 4)
  const estimatedCompletionTokens = Math.ceil(content.length / 4)
  const tokensUsed = { prompt: estimatedPromptTokens, completion: estimatedCompletionTokens }

  return { content, tokensUsed }
}

/** Ollama local client — final fallback */
async function callOllama(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number }): Promise<ProviderCallResult> {
  const result = await createOllamaCompletion(messages, { model, temperature: options?.temperature })
  const content = (result.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content || ''
  // Ollama may return usage data in some configurations but not guaranteed
  const usage = (result as Record<string, unknown>).usage as { prompt_tokens?: number; completion_tokens?: number } | undefined
  const tokensUsed = usage?.prompt_tokens != null && usage?.completion_tokens != null
    ? { prompt: usage.prompt_tokens, completion: usage.completion_tokens }
    : undefined
  return { content, tokensUsed }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Router — Main Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Route an LLM call to the optimal model based on task type and user tier.
 *
 * Returns a RouterResult with the content, model used, provider, and status.
 * Status is ALWAYS one of:
 *   "live"        — Real LLM response, minimal modification
 *   "estimated"  — LLM response with significant clamping/processing
 *   "simulation"  — Hardcoded fallback data (LLM unavailable)
 */
export async function routeLLM(
  messages: Array<{role: string; content: string}>,
  options: RouterOptions,
): Promise<RouterResult> {
  const {
    taskType,
    tier = 'free_trial',
    preferredModel,
    temperature = 0.7,
    maxTokens = 4096,
    timeout = 30000,
    allowSimulation = true,
    jsonMode = false,
  } = options

  const constraints = TIER_CONSTRAINTS[tier] || TIER_CONSTRAINTS.free_trial
  const modelChain = TASK_MODEL_MAP[taskType] || TASK_MODEL_MAP.chat

  // If user specified a preferred model and it's allowed, try it first
  const orderedModels = preferredModel
    ? [preferredModel, ...modelChain.filter(m => m !== preferredModel)]
    : modelChain

  // Filter models by tier constraints
  const eligibleModels = orderedModels.filter(modelKey => {
    const spec = MODEL_REGISTRY[modelKey]
    if (!spec) return false
    if (!constraints.allowedProviders.includes(spec.provider)) return false
    if (!spec.free && spec.costPer1kInput && spec.costPer1kInput > 0) {
      const estimatedCost = (spec.costPer1kInput * 2 + (spec.costPer1kOutput ?? 0) * 1) / 1000
      if (estimatedCost > constraints.maxCostPerCall) return false
    }
    return true
  })

  // If no eligible models, fall back to free ones
  const modelsToTry = eligibleModels.length > 0 ? eligibleModels : modelChain.filter(k => {
    const spec = MODEL_REGISTRY[k]
    return spec?.free
  })

  const fallbackChain: string[] = []
  const startTime = Date.now()

  for (const modelKey of modelsToTry) {
    const spec = MODEL_REGISTRY[modelKey]
    if (!spec) continue

    fallbackChain.push(`${spec.provider}/${spec.id}`)
    const attemptStart = Date.now()

    try {
      console.log(`[ai-router] Trying ${modelKey} (${spec.provider}) for task "${taskType}", tier "${tier}"`)

      let callResult: ProviderCallResult

      switch (spec.provider) {
        case 'groq':
          callResult = await Promise.race([
            callGroq(spec.id, messages, { temperature, maxTokens }),
            timeoutPromise(timeout),
          ])
          break

        case 'gemini':
          callResult = await Promise.race([
            callGemini(spec.id, messages, { temperature, maxTokens }),
            timeoutPromise(timeout),
          ])
          break

        case 'openrouter':
          callResult = await Promise.race([
            callOpenRouter(spec.id, messages, { temperature, maxTokens, jsonMode }),
            timeoutPromise(timeout),
          ])
          break

        case 'openai':
          callResult = await Promise.race([
            callOpenAI(spec.id, messages, { temperature, maxTokens }),
            timeoutPromise(timeout + 15000), // OpenAI gets extra time
          ])
          break

        case 'zai':
          callResult = await Promise.race([
            callZAI(messages),
            timeoutPromise(timeout),
          ])
          break

        case 'ollama':
          callResult = await Promise.race([
            callOllama(spec.id, messages, { temperature }),
            timeoutPromise(timeout),
          ])
          break

        default:
          continue
      }

      if (!callResult.content || callResult.content.trim().length === 0) {
        throw new Error('Empty response from provider')
      }

      const latencyMs = Date.now() - attemptStart

      // Calculate actual cost based on token usage (or estimate if tokens not available)
      const tokensUsed = callResult.tokensUsed
      let costUsd: number
      if (tokensUsed) {
        costUsd = (tokensUsed.prompt / 1000) * (spec.costPer1kInput || 0)
                  + (tokensUsed.completion / 1000) * (spec.costPer1kOutput || 0)
      } else {
        // Fallback estimate: assume ~2K input tokens, ~1K output tokens
        costUsd = spec.costPer1kInput ? (spec.costPer1kInput * 2 + (spec.costPer1kOutput || 0) * 1) / 1000 : 0
      }

      console.log(`[ai-router] ✅ ${modelKey} succeeded (${latencyMs}ms) for task "${taskType}"${tokensUsed ? `, tokens: ${tokensUsed.prompt}+${tokensUsed.completion}` : ''}`)

      // Save token usage to database
      const agentId = options.agentName || `ai-router-${taskType}`
      const agentName = options.agentName || taskType
      try {
        const tracker = new TokenTracker(`route-${Date.now()}`)
        tracker.track({
          agentId,
          agentName,
          model: modelKey,
          inputTokens: tokensUsed?.prompt ?? 0,
          outputTokens: tokensUsed?.completion ?? 0,
        })
        await tracker.saveToDatabase()
        console.log(`[ai-router] Token usage saved to DB: ${agentId}/${modelKey}`)
      } catch (dbErr) {
        // Non-blocking: don't fail the request if DB save fails
        console.warn(`[ai-router] Failed to save token usage to DB:`, dbErr instanceof Error ? dbErr.message : dbErr)
      }

      return {
        content: callResult.content,
        model: modelKey,
        provider: spec.provider,
        status: 'live',
        latencyMs: Date.now() - startTime,
        tokensUsed,
        costUsd,
        fallbackChain,
      }
    } catch (err) {
      const latencyMs = Date.now() - attemptStart
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.warn(`[ai-router] ❌ ${modelKey} failed (${latencyMs}ms): ${errorMsg}`)
      // Continue to next model in chain
    }
  }

  // All providers failed
  console.error(`[ai-router] All providers exhausted for task "${taskType}". Tried: ${fallbackChain.join(' → ')}`)

  if (allowSimulation) {
    return {
      content: '',
      model: 'simulation',
      provider: 'simulation',
      status: 'simulation',
      latencyMs: Date.now() - startTime,
      fallbackChain,
    }
  }

  throw new Error(`All LLM providers failed for task "${taskType}". Tried: ${fallbackChain.join(' → ')}`)
}

/** Helper: create a timeout promise that rejects */
function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`LLM timeout after ${ms}ms`)), ms)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Get the router's recommended model for a task/tier (for display)
// ─────────────────────────────────────────────────────────────────────────────

export function getRecommendedModel(taskType: TaskType, tier: string = 'free_trial'): { model: string; provider: string; free: boolean } {
  const modelChain = TASK_MODEL_MAP[taskType] || TASK_MODEL_MAP.chat
  const constraints = TIER_CONSTRAINTS[tier] || TIER_CONSTRAINTS.free_trial

  for (const modelKey of modelChain) {
    const spec = MODEL_REGISTRY[modelKey]
    if (!spec) continue
    if (!constraints.allowedProviders.includes(spec.provider)) continue
    return { model: modelKey, provider: spec.provider, free: spec.free }
  }

  return { model: 'unknown', provider: 'unknown', free: false }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Get all available models info (for admin dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export function getModelRegistry(): Record<string, ModelSpec> {
  return { ...MODEL_REGISTRY }
}

export function getTaskModelMap(): Record<TaskType, string[]> {
  return { ...TASK_MODEL_MAP }
}

export function getTierConstraints(): Record<string, { allowedProviders: ProviderId[]; maxCostPerCall: number; preferFree: boolean }> {
  return { ...TIER_CONSTRAINTS }
}

// ─────────────────────────────────────────────────────────────────────────────
// Circuit Breaker — Provider Health Status
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderHealthEntry {
  provider: ProviderId
  status: 'healthy' | 'degraded' | 'down' | 'cooldown'
  lastSuccess: Date | null
  lastFailure: Date | null
  consecutiveFailures: number
  cooldownUntil: Date | null
  message?: string
}

// In-memory circuit breaker state
const providerHealthMap = new Map<ProviderId, ProviderHealthEntry>()

function initProviderHealth(provider: ProviderId): ProviderHealthEntry {
  if (!providerHealthMap.has(provider)) {
    providerHealthMap.set(provider, {
      provider,
      status: 'healthy',
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      cooldownUntil: null,
    })
  }
  return providerHealthMap.get(provider)!
}

export function getProviderHealthStatus(): ProviderHealthEntry[] {
  const allProviders: ProviderId[] = ['groq', 'gemini', 'openrouter', 'openai', 'zai', 'ollama']
  return allProviders.map(p => {
    const entry = initProviderHealth(p)
    // Check if cooldown has expired
    if (entry.cooldownUntil && new Date() > entry.cooldownUntil) {
      entry.status = 'degraded'
      entry.cooldownUntil = null
      entry.consecutiveFailures = 0
    }
    return { ...entry }
  })
}

export function recordProviderSuccess(provider: ProviderId): void {
  const entry = initProviderHealth(provider)
  entry.lastSuccess = new Date()
  entry.consecutiveFailures = 0
  entry.status = 'healthy'
  entry.cooldownUntil = null
}

export function recordProviderFailure(provider: ProviderId, error?: string): void {
  const entry = initProviderHealth(provider)
  entry.lastFailure = new Date()
  entry.consecutiveFailures++
  
  if (entry.consecutiveFailures >= 3) {
    entry.status = 'cooldown'
    // Cooldown for 5 minutes
    entry.cooldownUntil = new Date(Date.now() + 5 * 60 * 1000)
    entry.message = error || `${entry.consecutiveFailures} consecutive failures`
  } else {
    entry.status = 'degraded'
  }
}
