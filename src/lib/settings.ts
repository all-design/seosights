/**
 * System Settings — Database-backed configuration
 *
 * Allows superadmin to manage API keys, Stripe config, etc.
 * through the Superadmin Panel instead of environment variables.
 *
 * Priority: DB setting > environment variable > default
 *
 * Security:
 * - Secret values (isSecret=true) are masked in API responses
 * - Only superadmin-authenticated requests can read/write
 * - Values are stored as-is in DB (encryption at rest via Turso/libSQL)
 */

import { db } from '@/lib/db'

// ── Settings Definitions ─────────────────────────────────────────────────

export interface SettingDefinition {
  key: string
  label: string
  description: string
  category: 'payment' | 'ai' | 'auth' | 'general'
  isSecret: boolean
  placeholder: string
  envVar: string // Which env var this setting overrides
}

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  // ── Payment / Stripe ─────────────────────────────────────────────────
  {
    key: 'stripe_secret_key',
    label: 'Stripe Secret Key',
    description: 'Your Stripe secret key (sk_live_... or sk_test_...). Used for checkout sessions, subscriptions, and webhooks.',
    category: 'payment',
    isSecret: true,
    placeholder: 'sk_live_...',
    envVar: 'STRIPE_SECRET_KEY',
  },
  {
    key: 'stripe_publishable_key',
    label: 'Stripe Publishable Key',
    description: 'Your Stripe publishable key (pk_live_...). Safe to use in frontend code.',
    category: 'payment',
    isSecret: false,
    placeholder: 'pk_live_...',
    envVar: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  },
  {
    key: 'stripe_starter_price_id',
    label: 'Starter Plan Price ID',
    description: 'Stripe Price ID for the Starter plan ($9.90/month launch promo, then $19/month).',
    category: 'payment',
    isSecret: false,
    placeholder: 'price_...',
    envVar: 'STRIPE_STARTER_PRICE_ID',
  },
  {
    key: 'stripe_pro_price_id',
    label: 'Pro Agency Plan Price ID',
    description: 'Stripe Price ID for the Pro Agency plan ($79/month).',
    category: 'payment',
    isSecret: false,
    placeholder: 'price_...',
    envVar: 'STRIPE_PRO_PRICE_ID',
  },
  {
    key: 'stripe_managed_price_id',
    label: 'Managed Plan Price ID',
    description: 'Stripe Price ID for the Managed/Enterprise plan (if using Stripe for billing).',
    category: 'payment',
    isSecret: false,
    placeholder: 'price_...',
    envVar: 'STRIPE_MANAGED_PRICE_ID',
  },
  {
    key: 'stripe_webhook_secret',
    label: 'Stripe Webhook Secret',
    description: 'Signing secret for verifying Stripe webhook events (whsec_...).',
    category: 'payment',
    isSecret: true,
    placeholder: 'whsec_...',
    envVar: 'STRIPE_WEBHOOK_SECRET',
  },

  // ── AI / LLM ─────────────────────────────────────────────────────────
  {
    key: 'openai_api_key',
    label: 'OpenAI API Key',
    description: 'Your OpenAI API key for GPT-4o, GPT-4o-mini, etc. (sk-...).',
    category: 'ai',
    isSecret: true,
    placeholder: 'sk-...',
    envVar: 'OPENAI_API_KEY',
  },
  {
    key: 'ollama_base_url',
    label: 'Ollama Base URL',
    description: 'URL for local Ollama instance (fallback LLM). Only used if primary models fail.',
    category: 'ai',
    isSecret: false,
    placeholder: 'http://localhost:11434',
    envVar: 'OLLAMA_BASE_URL',
  },
  {
    key: 'ollama_model',
    label: 'Ollama Model',
    description: 'Model name for Ollama fallback (e.g. llama3, mistral, codellama).',
    category: 'ai',
    isSecret: false,
    placeholder: 'llama3',
    envVar: 'OLLAMA_MODEL',
  },

  // ── Auth ──────────────────────────────────────────────────────────────
  {
    key: 'superadmin_secret',
    label: 'Superadmin Secret',
    description: 'Secret key to access the Superadmin Portal. Change this periodically for security.',
    category: 'auth',
    isSecret: true,
    placeholder: 'your-secret-key',
    envVar: 'SUPERADMIN_SECRET',
  },
  {
    key: 'jwt_secret',
    label: 'JWT Secret',
    description: 'Secret used to sign JWT tokens. Changing this will invalidate all active sessions.',
    category: 'auth',
    isSecret: true,
    placeholder: 'your-jwt-secret',
    envVar: 'JWT_SECRET',
  },
]

// ── Helper: Get a setting value (DB > env var > default) ─────────────────

/**
 * Get a setting value with fallback chain:
 * 1. Database (SystemSetting table) — highest priority
 * 2. Environment variable — fallback
 * 3. Default value — last resort
 */
export async function getSetting(key: string, defaultValue?: string): Promise<string | undefined> {
  // Try DB first
  try {
    const setting = await db.systemSetting.findUnique({ where: { key } })
    if (setting?.value) {
      return setting.value
    }
  } catch {
    // DB might not be available (migration pending, etc.)
  }

  // Try env var
  const definition = SETTING_DEFINITIONS.find(d => d.key === key)
  if (definition?.envVar) {
    const envValue = process.env[definition.envVar]
    if (envValue) return envValue
  }

  return defaultValue
}

/**
 * Get a setting value synchronously (env var only — no DB call).
 * Use this in module initialization (e.g., stripe.ts top-level code).
 * For runtime usage, prefer the async getSetting().
 */
export function getSettingEnv(key: string, defaultValue?: string): string | undefined {
  const definition = SETTING_DEFINITIONS.find(d => d.key === key)
  if (definition?.envVar) {
    const envValue = process.env[definition.envVar]
    if (envValue) return envValue
  }
  return defaultValue
}

// ── Helper: Mask secret values for API responses ─────────────────────────

export function maskSecret(value: string): string {
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 4) + '••••' + value.slice(-4)
}

/**
 * Get all settings for the superadmin UI.
 * Secret values are masked unless revealSecrets=true.
 */
export async function getAllSettings(revealSecrets = false): Promise<
  Array<SettingDefinition & { currentValue: string | null; source: 'database' | 'env' | 'unset' }>
> {
  const dbSettings = await db.systemSetting.findMany()
  const dbMap = new Map(dbSettings.map(s => [s.key, s]))

  return SETTING_DEFINITIONS.map(def => {
    const dbSetting = dbMap.get(def.key)
    const envValue = process.env[def.envVar]

    let currentValue: string | null = null
    let source: 'database' | 'env' | 'unset' = 'unset'

    if (dbSetting?.value) {
      currentValue = def.isSecret && !revealSecrets ? maskSecret(dbSetting.value) : dbSetting.value
      source = 'database'
    } else if (envValue) {
      currentValue = def.isSecret && !revealSecrets ? maskSecret(envValue) : envValue
      source = 'env'
    }

    return {
      ...def,
      currentValue,
      source,
    }
  })
}

/**
 * Save a setting to the database.
 * Uses upsert to create or update.
 */
export async function saveSetting(key: string, value: string, updatedBy?: string): Promise<void> {
  const definition = SETTING_DEFINITIONS.find(d => d.key === key)
  if (!definition) {
    throw new Error(`Unknown setting key: ${key}`)
  }

  await db.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value,
      category: definition.category,
      isSecret: definition.isSecret,
      description: definition.description,
      updatedBy,
    },
    update: {
      value,
      updatedBy,
    },
  })
}

/**
 * Delete a setting from the database (revert to env var).
 */
export async function deleteSetting(key: string): Promise<void> {
  await db.systemSetting.deleteMany({ where: { key } })
}
