/**
 * AI Router Status API — GET /api/ai-router/status
 *
 * Returns the real AI Router status:
 *   - providers : array of { id, configured: boolean, models: [...] }
 *   - tierConstraints : the tier → allowedProviders / maxCostPerCall / preferFree map
 *
 * A provider is "configured" if its API key env var is set. The key itself is
 * NEVER exposed — only the boolean. Ollama is treated as always available
 * (local daemon), but we mark it configured only if OLLAMA_BASE_URL is set.
 *
 * This powers the "AI Router" card on the dashboard.
 */

import { NextResponse } from 'next/server'
import {
  getModelRegistry,
  getTierConstraints,
  getProviderHealthStatus,
  type ProviderId,
} from '@/lib/ai-router'

export const dynamic = 'force-dynamic'

// Map provider → env var that gates it
const PROVIDER_ENV_KEY: Record<ProviderId, string | null> = {
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  zai: 'ZAI_API_KEY',
  // Ollama runs as a local daemon; check for an explicit base URL.
  // If unset, we still mark it as "available" since localhost:11434 is the
  // default — the call will simply fail at runtime if not running.
  ollama: 'OLLAMA_BASE_URL',
}

interface ProviderStatus {
  id: ProviderId
  configured: boolean
  hasEnvVar: string | null
  models: Array<{
    key: string         // full registry key, e.g. 'groq/llama-3.1-70b'
    id: string          // provider-native model id
    free: boolean
    contextWindow: number
    speed: 'ultra' | 'fast' | 'medium' | 'slow'
    quality: 'basic' | 'good' | 'excellent' | 'state_of_art'
    costPer1kInput?: number
    costPer1kOutput?: number
  }>
}

function isProviderConfigured(provider: ProviderId): boolean {
  const envVar = PROVIDER_ENV_KEY[provider]
  if (!envVar) return false
  const value = process.env[envVar]
  return typeof value === 'string' && value.trim().length > 0
}

export async function GET() {
  try {
    const registry = getModelRegistry()
    const tierConstraints = getTierConstraints()

    // Group models by provider
    const providersById = new Map<ProviderId, ProviderStatus>()

    for (const [modelKey, spec] of Object.entries(registry)) {
      let entry = providersById.get(spec.provider)
      if (!entry) {
        const configured = isProviderConfigured(spec.provider)
        entry = {
          id: spec.provider,
          configured,
          // For display: which env var would the user need to set
          hasEnvVar: PROVIDER_ENV_KEY[spec.provider],
          models: [],
        }
        providersById.set(spec.provider, entry)
      }
      entry.models.push({
        key: modelKey,
        id: spec.id,
        free: spec.free,
        contextWindow: spec.contextWindow,
        speed: spec.speed,
        quality: spec.quality,
        costPer1kInput: spec.costPer1kInput,
        costPer1kOutput: spec.costPer1kOutput,
      })
    }

    // Sort providers in a stable, intuitive order
    const PROVIDER_ORDER: ProviderId[] = [
      'groq',
      'gemini',
      'openrouter',
      'openai',
      'zai',
      'ollama',
    ]
    const providers = PROVIDER_ORDER
      .map((id) => providersById.get(id))
      .filter((p): p is ProviderStatus => p !== undefined)

    // Count configured providers — the dashboard uses this to render a status pill
    const configuredCount = providers.filter((p) => p.configured).length
    const totalProviders = providers.length
    const overallStatus =
      configuredCount >= 3 ? 'ok' : configuredCount >= 1 ? 'degraded' : 'down'

    // ── Circuit Breaker State ───────────────────────────────────────────────
    // Expose which providers are currently in cooldown so the dashboard can
    // show "OpenRouter: out of credits (retry in 4m 32s)" instead of mystery.
    const providerHealth = getProviderHealthStatus()

    return NextResponse.json({
      providers,
      tierConstraints,
      providerHealth,
      summary: {
        configuredCount,
        totalProviders,
        overallStatus,
        message:
          configuredCount === 0
            ? 'No LLM providers configured — Governor will run in rule-based fallback mode.'
            : configuredCount < 3
              ? `${configuredCount} of ${totalProviders} providers configured — quality may be limited.`
              : `${configuredCount} of ${totalProviders} providers configured — full router capability.`,
      },
    })
  } catch (error) {
    console.error('[api/ai-router/status] Failed:', error)
    return NextResponse.json(
      {
        providers: [],
        tierConstraints: {},
        providerHealth: [],
        summary: {
          configuredCount: 0,
          totalProviders: 0,
          overallStatus: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
