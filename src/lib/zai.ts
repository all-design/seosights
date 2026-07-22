/**
 * zai.ts — LEGACY backward-compatibility shim
 *
 * DEPRECATED: Use routeLLM() from '@/lib/ai-router' instead.
 * This file now wraps routeLLM() so any legacy code still calling
 * getZAI() or createChatCompletion() will work through the proper router.
 *
 * Primary provider: OpenRouter (GLM 5.2 / GLM Turbo)
 * Fallback chain: OpenRouter → Groq → Gemini → OpenAI → Ollama → ZAI SDK (last resort)
 */

import { routeLLM, type TaskType } from './ai-router'

/**
 * @deprecated Use routeLLM() from '@/lib/ai-router' directly.
 * Legacy shim that returns a ZAI-like object whose chat.completions.create()
 * delegates to routeLLM() with the specified task type.
 */
export async function getZAI() {
  return {
    chat: {
      completions: {
        create: async (params: {
          messages: Array<{ role: string; content: string }>
          taskType?: TaskType
          temperature?: number
          maxTokens?: number
        }) => {
          const result = await routeLLM(params.messages, {
            taskType: params.taskType || 'chat',
            temperature: params.temperature,
            maxTokens: params.maxTokens,
          })
          // Return OpenAI-compatible response format
          return {
            choices: [{
              message: { content: result.content },
              finish_reason: 'stop',
            }],
            model: result.model,
            provider: result.provider,
            status: result.status,
          }
        },
      },
    },
    // Preserve ZAI functions interface for legacy code
    functions: {
      invoke: async (_name: string, _params?: Record<string, unknown>) => {
        console.warn('[zai-shim] functions.invoke is deprecated. Use routeLLM() or direct implementation.')
        throw new Error('ZAI functions.invoke is no longer supported. Use routeLLM() or implement directly.')
      },
    },
  }
}

/**
 * @deprecated Use routeLLM() from '@/lib/ai-router' directly.
 * Legacy shim that delegates to routeLLM() with the specified task type.
 * Returns the content string directly (same as old createChatCompletion behavior).
 */
export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: { model?: string; temperature?: number; taskType?: TaskType }
): Promise<string> {
  const result = await routeLLM(messages, {
    taskType: options?.taskType || 'chat',
    temperature: options?.temperature,
    maxTokens: 4096,
  })
  return result.content
}
