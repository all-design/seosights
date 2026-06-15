/**
 * z-ai-web-dev-sdk Initialization Utility
 *
 * In development: uses ZAI SDK with /etc/.z-ai-config (sandbox default)
 * In production (Vercel): creates ZAI instance from Z_AI_CONFIG env var
 *
 * IMPORTANT: On Vercel, the internal-api.z.ai endpoint used by ZAI SDK
 * is unreachable (it's only accessible from Z.ai sandbox). LLM calls
 * via zai.chat.completions.create() will fail with ETIMEDOUT.
 *
 * For production LLM calls, use getLLM() which returns an OpenAI-compatible
 * client when OPENAI_API_KEY is set, or the ZAI SDK otherwise.
 *
 * Fallback chain: ZAI SDK → OpenAI → Ollama (local)
 */
import path from 'path'
import { createOllamaCompletion } from './agent-fallback'

let zaiInstance: unknown = null

export async function getZAI() {
  if (zaiInstance) return zaiInstance

  const ZAI = (await import('z-ai-web-dev-sdk')).default

  // In production (Vercel/etc), use env var directly — no file system writes needed
  const envConfig = process.env.Z_AI_CONFIG
  if (envConfig) {
    try {
      const config = JSON.parse(envConfig)
      if (config.baseUrl && config.apiKey) {
        zaiInstance = new ZAI(config)
        console.log('[zai] Initialized from Z_AI_CONFIG env var (no file write)')
        return zaiInstance
      }
    } catch (e) {
      console.error('[zai] Failed to parse Z_AI_CONFIG env var:', e instanceof Error ? e.message : 'Unknown')
    }
  }

  // Fallback: use SDK's built-in file-based config loading (works in local dev)
  try {
    zaiInstance = await ZAI.create()
    console.log('[zai] Initialized from .z-ai-config file')
    return zaiInstance
  } catch (e) {
    console.error('[zai] Failed to initialize:', e instanceof Error ? e.message : 'Unknown')
    throw new Error('ZAI SDK initialization failed. Set Z_AI_CONFIG env var or provide .z-ai-config file.')
  }
}

/**
 * Create a chat completion using the best available LLM provider.
 * Fallback chain: OpenAI (Vercel) → ZAI SDK → Ollama (local)
 */
export async function createChatCompletion(messages: Array<{role: string; content: string}>, options?: { model?: string; temperature?: number }): Promise<string> {
  // On Vercel with OpenAI key available, use OpenAI directly
  if (process.env.VERCEL && process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const response = await openai.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? 0.7,
      })
      const content = response.choices[0]?.message?.content || ''
      console.log('[llm] OpenAI response received')
      return content
    } catch (err) {
      console.error('[llm] OpenAI call failed:', err instanceof Error ? err.message : 'Unknown')
      // Fall through to ZAI SDK, then Ollama
    }
  }

  // Try ZAI SDK
  try {
    const zai = await getZAI()
    const result = await zai.chat.completions.create({
      messages: messages as Array<{role: string; content: string}>,
    })

    // Extract content from ZAI response
    const raw = (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content || ''
    if (raw) {
      console.log('[llm] ZAI SDK response received')
      return raw
    }
  } catch (err) {
    console.error('[llm] ZAI SDK call failed:', err instanceof Error ? err.message : 'Unknown')
    // Fall through to Ollama
  }

  // Final fallback: try Ollama
  try {
    console.log('[llm] Attempting Ollama as final fallback')
    const ollamaResult = await createOllamaCompletion(messages, {
      model: options?.model,
      temperature: options?.temperature,
    })
    const content = (ollamaResult.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content || ''
    if (content) {
      console.log('[llm] Ollama response received')
      return content
    }
    throw new Error('Ollama returned empty content')
  } catch (err) {
    console.error('[llm] Ollama fallback failed:', err instanceof Error ? err.message : 'Unknown')
    throw new Error('All LLM providers failed. ZAI SDK, OpenAI, and Ollama are all unavailable.')
  }
}
