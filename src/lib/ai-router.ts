/**
 * AI Router — Smart Task-Based Model Routing
 *
 * Instead of a static fallback chain, the AI Router selects the optimal LLM
 * model based on the TASK TYPE. Different tasks have different requirements:
 *
 * | Task              | Best Model          | Why                        |
 * |-------------------|---------------------|----------------------------|
 * | scoring           | Gemini Flash        | Fast, cheap, good at numbers |
 * | entity_extraction | Groq Llama 3.1      | Fast inference, structured output |
 * | summarization     | Groq                | Speed + quality balance    |
 * | long_report       | Gemini              | Huge context window        |
 * | strategy          | OpenAI / ZAI        | Best reasoning             |
 * | code              | DeepSeek            | Code-specialized           |
 * | reasoning         | Best available      | Complex chain-of-thought   |
 *
 * Then the Smart Budget Engine applies TIER constraints:
 * | Free    → Gemini Flash (free tier)  |
 * | Starter → Groq (free tier)          |
 * | Pro     → OpenAI / best available   |
 * | Managed → Best model available      |
 *
 * Provider Priority:
 * 1. Groq (free, ultra-fast, Llama 3.1 70B / Mixtral)
 * 2. Google Gemini (free tier, Gemini 1.5 Flash)
 * 3. OpenRouter (free models, 100+ options)
 * 4. OpenAI (paid, highest quality)
 * 5. ZAI SDK (sandbox default)
 * 6. Ollama (local fallback)
 */

import { createOllamaCompletion } from './agent-fallback'

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

export type ProviderId = 'groq' | 'gemini' | 'openrouter' | 'openai' | 'zai' | 'ollama'

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
    id: 'gemini-1.5-flash',
    provider: 'gemini',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 1048576,
    speed: 'fast',
    quality: 'excellent',
    free: true,
  },
  'gemini/pro': {
    id: 'gemini-1.5-pro',
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
    id: 'deepseek/deepseek-chat-v3-0324:free',
    provider: 'openrouter',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 65536,
    speed: 'fast',
    quality: 'excellent',
    free: true,
  },
  'openrouter/llama-3.1-8b': {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    provider: 'openrouter',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    contextWindow: 131072,
    speed: 'fast',
    quality: 'good',
    free: true,
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

  // ─── ZAI SDK (Sandbox Default) ────────────────────────────────────────
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
  scoring:           ['groq/llama-3.1-8b', 'gemini/flash', 'openrouter/deepseek-v3', 'openai/gpt-4o-mini', 'zai/default', 'ollama/llama3'],
  entity_extraction: ['groq/llama-3.1-70b', 'gemini/flash', 'openrouter/deepseek-v3', 'openai/gpt-4o-mini', 'zai/default', 'ollama/llama3'],
  summarization:     ['groq/llama-3.1-70b', 'gemini/flash', 'openrouter/deepseek-v3', 'openai/gpt-4o-mini', 'zai/default', 'ollama/llama3'],
  long_report:       ['gemini/pro', 'gemini/flash', 'groq/llama-3.1-70b', 'openrouter/deepseek-v3', 'openai/gpt-4o', 'zai/default', 'ollama/llama3'],
  strategy:          ['openai/gpt-4o', 'groq/llama-3.1-70b', 'gemini/pro', 'openrouter/deepseek-v3', 'zai/default', 'ollama/llama3'],
  code:              ['openrouter/deepseek-v3', 'groq/llama-3.1-70b', 'gemini/flash', 'openai/gpt-4o-mini', 'zai/default', 'ollama/llama3'],
  reasoning:         ['openai/gpt-4o', 'groq/llama-3.1-70b', 'gemini/pro', 'openrouter/deepseek-v3', 'zai/default', 'ollama/llama3'],
  classification:    ['groq/llama-3.1-8b', 'gemini/flash', 'openrouter/deepseek-v3', 'zai/default', 'ollama/llama3'],
  chat:              ['groq/llama-3.1-70b', 'gemini/flash', 'openai/gpt-4o-mini', 'zai/default', 'ollama/llama3'],
  embedding:         ['gemini/flash', 'zai/default'],
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier → Model Constraints (Smart Budget Engine)
// ─────────────────────────────────────────────────────────────────────────────

const TIER_CONSTRAINTS: Record<string, { allowedProviders: ProviderId[]; maxCostPerCall: number; preferFree: boolean }> = {
  free_trial: { allowedProviders: ['groq', 'gemini', 'openrouter', 'zai', 'ollama'], maxCostPerCall: 0, preferFree: true },
  starter:    { allowedProviders: ['groq', 'gemini', 'openrouter', 'zai', 'ollama'], maxCostPerCall: 0, preferFree: true },
  pro:        { allowedProviders: ['groq', 'gemini', 'openrouter', 'openai', 'zai', 'ollama'], maxCostPerCall: 0.05, preferFree: false },
  managed:    { allowedProviders: ['groq', 'gemini', 'openrouter', 'openai', 'zai', 'ollama'], maxCostPerCall: 0.50, preferFree: false },
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Clients
// ─────────────────────────────────────────────────────────────────────────────

/** Groq API client — ultra-fast free inference */
async function callGroq(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
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

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content || ''
}

/** Google Gemini API client — huge context, free tier */
async function callGemini(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
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

  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/** OpenRouter API client — access to 100+ models */
async function callOpenRouter(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://seosights.com',
      'X-Title': 'seosights AI Visibility Platform',
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    }),
    signal: AbortSignal.timeout(45000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${body}`)
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content || ''
}

/** OpenAI API client — highest quality (paid) */
async function callOpenAI(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })

  const response = await openai.chat.completions.create({
    model,
    messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
  })

  return response.choices[0]?.message?.content || ''
}

/** ZAI SDK client — sandbox default */
async function callZAI(messages: Array<{role: string; content: string}>): Promise<string> {
  const { getZAI } = await import('./zai')
  const zai = await getZAI()
  const result = await zai.chat.completions.create({
    messages: messages as Array<{role: string; content: string}>,
  })
  return (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content || ''
}

/** Ollama local client — final fallback */
async function callOllama(model: string, messages: Array<{role: string; content: string}>, options?: { temperature?: number }): Promise<string> {
  const result = await createOllamaCompletion(messages, { model, temperature: options?.temperature })
  return (result.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content || ''
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
      const estimatedCost = (spec.costPer1kInput * 2 + spec.costPer1kOutput * 1) / 1000
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

      let content: string

      switch (spec.provider) {
        case 'groq':
          content = await Promise.race([
            callGroq(spec.id, messages, { temperature, maxTokens }),
            timeoutPromise(timeout),
          ])
          break

        case 'gemini':
          content = await Promise.race([
            callGemini(spec.id, messages, { temperature, maxTokens }),
            timeoutPromise(timeout),
          ])
          break

        case 'openrouter':
          content = await Promise.race([
            callOpenRouter(spec.id, messages, { temperature, maxTokens }),
            timeoutPromise(timeout),
          ])
          break

        case 'openai':
          content = await Promise.race([
            callOpenAI(spec.id, messages, { temperature, maxTokens }),
            timeoutPromise(timeout + 15000), // OpenAI gets extra time
          ])
          break

        case 'zai':
          content = await Promise.race([
            callZAI(messages),
            timeoutPromise(timeout),
          ])
          break

        case 'ollama':
          content = await Promise.race([
            callOllama(spec.id, messages, { temperature }),
            timeoutPromise(timeout),
          ])
          break

        default:
          continue
      }

      if (!content || content.trim().length === 0) {
        throw new Error('Empty response from provider')
      }

      const latencyMs = Date.now() - attemptStart

      console.log(`[ai-router] ✅ ${modelKey} succeeded (${latencyMs}ms) for task "${taskType}"`)

      return {
        content,
        model: modelKey,
        provider: spec.provider,
        status: 'live',
        latencyMs: Date.now() - startTime,
        costUsd: spec.costPer1kInput ? spec.costPer1kInput * 2 / 1000 : 0,
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
